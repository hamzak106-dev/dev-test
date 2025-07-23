import { RedisService } from "@/features/redis";
import { getRedis } from "@/lib/redis";
import { createServiceContext } from "@/utils/service-utils";
import type { SSEEvent, SSEConnection, SSEManagerInterface } from "../types";

const { log, handleError } = createServiceContext("SSEManager");

/**
 * Core SSE Manager that handles connection lifecycle and event dispatching
 */
class SSEManager implements SSEManagerInterface {
  private redis: RedisService | null = null;
  private readonly connections = new Map<
    string,
    {
      controller: ReadableStreamDefaultController<Uint8Array>;
      userId?: string;
      connectedAt: number;
      lastHeartbeat: number;
    }
  >();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TTL = 3600; // 1 hour in seconds

  constructor() {
    void this.initializeRedis();
    this.startHeartbeat();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisClient = await getRedis();
      this.redis = new RedisService(redisClient);
    } catch (error) {
      handleError("initializing Redis connection", error);
    }
  }

  /**
   * Get Redis instance, initialize if needed
   */
  private async getRedisInstance(): Promise<RedisService> {
    if (!this.redis) {
      await this.initializeRedis();
    }
    if (!this.redis) {
      throw new Error("Redis not initialized");
    }
    return this.redis;
  }

  /**
   * Add a new SSE connection
   */
  async addConnection(
    connectionId: string,
    userId?: string,
    controller?: ReadableStreamDefaultController<Uint8Array>,
  ): Promise<void> {
    try {
      const redis = await this.getRedisInstance();
      const now = Date.now();

      if (controller) {
        this.connections.set(connectionId, {
          controller,
          userId,
          connectedAt: now,
          lastHeartbeat: now,
        });
      }

      // Store connection info in Redis (only serializable data)
      const connectionData: SSEConnection = {
        id: connectionId,
        userId,
        connectedAt: now,
        lastHeartbeat: now,
      };

      await redis.hSet(
        `sse:connections:${connectionId}`,
        "data",
        JSON.stringify(connectionData),
      );

      // Set TTL for auto-cleanup
      await redis.setValue(`sse:connections:${connectionId}:ttl`, "1");

      // If user-specific, add to user mapping
      if (userId) {
        await redis.hSet(`sse:users:${userId}`, connectionId, "1");
      }

      log.info(`Connection added: ${connectionId}`, { userId });
    } catch (error) {
      handleError("adding SSE connection", error);
    }
  }

  /**
   * Remove an SSE connection with comprehensive cleanup
   */
  async removeConnection(connectionId: string): Promise<void> {
    try {
      const redis = await this.getRedisInstance();
      const connection = this.connections.get(connectionId);

      // Clean up in-memory connection
      if (connection) {
        // Close the controller safely
        try {
          connection.controller?.close();
        } catch (error: unknown) {
          // Controller close errors are expected when already closed
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes("Controller is already closed")) {
            log.warn(
              `Unexpected error closing controller for ${connectionId}:`,
              error,
            );
          }
        }

        // Remove from in-memory connections
        this.connections.delete(connectionId);

        // Clean up user mapping
        if (connection.userId) {
          try {
            await redis.hDel(`sse:users:${connection.userId}`, connectionId);
          } catch (error) {
            log.warn(
              `Failed to remove user mapping for ${connectionId}:`,
              error,
            );
          }
        }
      } else {
        // Connection not in memory, but still try to clean up Redis data
        log.debug(
          `Connection ${connectionId} not found in memory, cleaning up Redis data`,
        );
      }

      // Clean up Redis data - use Promise.allSettled for robustness
      const cleanupPromises = [
        redis.deleteKey(`sse:connections:${connectionId}`),
        redis.deleteKey(`sse:connections:${connectionId}:ttl`),
      ];

      const results = await Promise.allSettled(cleanupPromises);
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const keyType = index === 0 ? "connection data" : "TTL";
          log.warn(
            `Failed to cleanup ${keyType} for ${connectionId}:`,
            result.reason,
          );
        }
      });

      log.info(`Connection removed: ${connectionId}`);
    } catch (error) {
      handleError("removing SSE connection", error);
    }
  }

  /**
   * Send event to a specific connection with improved error handling
   */
  async sendEvent(connectionId: string, event: SSEEvent): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection?.controller) {
        log.warn(`Connection not found or invalid: ${connectionId}`);
        return false;
      }

      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp ?? Date.now(),
        id: event.id ?? `${connectionId}-${Date.now()}`,
      };

      const sseData = this.formatSSEMessage(eventWithTimestamp);

      try {
        connection.controller.enqueue(new TextEncoder().encode(sseData));
        // Only log non-heartbeat events to reduce noise
        if (event.type !== "heartbeat") {
          log.info(`Event sent to connection ${connectionId}:`, {
            type: event.type,
          });
        }
        return true;
      } catch (enqueueError) {
        // Controller might be closed or in invalid state
        log.warn(`Failed to enqueue event to ${connectionId}:`, enqueueError);
        await this.removeConnection(connectionId);
        return false;
      }
    } catch (error) {
      log.error(`Error sending event to ${connectionId}:`, error);
      // Remove failed connection to prevent resource leaks
      await this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Send event to all connections of a specific user
   */
  async sendEventToUser(userId: string, event: SSEEvent): Promise<number> {
    try {
      const redis = await this.getRedisInstance();
      const userConnections = await redis.hGetAll(`sse:users:${userId}`);
      if (!userConnections) {
        log.info(`No connections found for user: ${userId}`);
        return 0;
      }

      const connectionIds = Object.keys(userConnections);
      let successCount = 0;

      for (const connectionId of connectionIds) {
        const success = await this.sendEvent(connectionId, event);
        if (success) successCount++;
      }

      log.info(
        `Event sent to ${successCount}/${connectionIds.length} connections for user ${userId}`,
      );
      return successCount;
    } catch (error) {
      handleError(`sending event to user ${userId}`, error);
      return 0;
    }
  }

  /**
   * Broadcast event to all active connections
   */
  async broadcastEvent(event: SSEEvent): Promise<number> {
    try {
      const connectionIds = Array.from(this.connections.keys());
      let successCount = 0;

      for (const connectionId of connectionIds) {
        const success = await this.sendEvent(connectionId, event);
        if (success) successCount++;
      }

      log.info(
        `Event broadcasted to ${successCount}/${connectionIds.length} connections`,
      );
      return successCount;
    } catch (error) {
      handleError("broadcasting event", error);
      return 0;
    }
  }

  /**
   * Get all active connections
   */
  async getActiveConnections(): Promise<SSEConnection[]> {
    try {
      const connections: SSEConnection[] = [];
      const connectionIds = Array.from(this.connections.keys());
      for (const connectionId of connectionIds) {
        try {
          const redis = await this.getRedisInstance();
          const connectionData = await redis.hGet(
            `sse:connections:${connectionId}`,
            "data",
          );
          if (connectionData) {
            try {
              const parsed = connectionData as unknown as SSEConnection;
              connections.push(parsed);
            } catch (parseError) {
              log.warn(
                `Invalid JSON for connection ${connectionId}, cleaning up:`,
                parseError,
              );
              await this.removeConnection(connectionId);
            }
          } else {
            log.warn(
              `No Redis data found for in-memory connection ${connectionId}, removing from memory`,
            );
            await this.removeConnection(connectionId);
          }
        } catch (error) {
          log.warn(`Error getting connection data for ${connectionId}:`, error);
          // Clean up problematic connection
          await this.removeConnection(connectionId);
        }
      }
      return connections;
    } catch (error) {
      handleError("getting active connections", error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all connections
      for (const [connectionId] of this.connections) {
        await this.removeConnection(connectionId);
      }

      log.info("SSE Manager cleanup completed");
    } catch (error) {
      handleError("cleaning up SSE manager", error);
    }
  }

  /**
   * Start heartbeat mechanism with stale connection detection
   */
  private startHeartbeat(): void {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.heartbeatInterval = setInterval(async () => {
      const connectionIds = Array.from(this.connections.keys());
      const now = Date.now();
      const staleThreshold = now - this.HEARTBEAT_INTERVAL * 3; // Consider stale after 3 missed heartbeats

      for (const connectionId of connectionIds) {
        try {
          const connection = this.connections.get(connectionId);

          // Check if connection is stale before sending heartbeat
          if (connection && connection.lastHeartbeat < staleThreshold) {
            log.warn(`Removing stale connection: ${connectionId}`);
            await this.removeConnection(connectionId);
            continue;
          }

          const success = await this.sendEvent(connectionId, {
            type: "heartbeat",
            data: { timestamp: now },
            timestamp: now,
          });

          if (success && connection) {
            // Update last heartbeat time
            connection.lastHeartbeat = now;
          } else if (!success) {
            // Failed to send heartbeat, connection is likely dead
            log.warn(
              `Heartbeat failed for connection ${connectionId}, removing`,
            );
            await this.removeConnection(connectionId);
          }
        } catch (error) {
          log.warn(`Heartbeat error for connection ${connectionId}:`, error);
          await this.removeConnection(connectionId);
        }
      }

      // Log connection status periodically (every 10 heartbeats)
      if (Math.floor(now / this.HEARTBEAT_INTERVAL) % 10 === 0) {
        log.info(`Active connections: ${this.connections.size}`);
      }
    }, this.HEARTBEAT_INTERVAL);

    log.info(
      `Heartbeat mechanism started (${this.HEARTBEAT_INTERVAL}ms interval)`,
    );
  }

  /**
   * Format event as SSE message
   */
  private formatSSEMessage(event: SSEEvent): string {
    let message = "";

    if (event.id) {
      message += `id: ${event.id}\n`;
    }

    message += `event: ${event.type}\n`;
    message += `data: ${JSON.stringify(event.data)}\n`;
    message += "\n";

    return message;
  }
}

// Singleton instance
let sseManagerInstance: SSEManager | null = null;

export const getSSEManager = (): SSEManager => {
  sseManagerInstance ??= new SSEManager();
  return sseManagerInstance;
};

export { SSEManager };
