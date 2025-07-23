import { getSSEManager } from "./sse-manager";
import { createServiceContext } from "@/utils/service-utils";
import type { SSEEvent, SSEConnection, SendEventInput } from "../types";

const { log, handleError } = createServiceContext("SSEService");

/**
 * Public SSE Service - Clean interface for backend modules to send events
 */
export class SSEService {
  private readonly manager = getSSEManager();

  /**
   * Send an event to a specific user's connections
   */
  async sendToUser(
    userId: string,
    event: Omit<SSEEvent, "timestamp">,
  ): Promise<number> {
    try {
      const eventWithTimestamp = {
        ...event,
        timestamp: Date.now(),
      };

      const count = await this.manager.sendEventToUser(
        userId,
        eventWithTimestamp,
      );
      log.info(`Event sent to user ${userId}: ${count} connections reached`, {
        type: event.type,
      });
      return count;
    } catch (error) {
      handleError(`sending event to user ${userId}`, error);
      return 0;
    }
  }

  /**
   * Broadcast an event to all connected clients
   */
  async broadcast(event: Omit<SSEEvent, "timestamp">): Promise<number> {
    try {
      const eventWithTimestamp = {
        ...event,
        timestamp: Date.now(),
      };

      const count = await this.manager.broadcastEvent(eventWithTimestamp);
      log.info(`Event broadcasted: ${count} connections reached`, {
        type: event.type,
      });
      return count;
    } catch (error) {
      handleError("broadcasting event", error);
      return 0;
    }
  }

  /**
   * Send event using input configuration
   */
  async sendEvent(input: SendEventInput): Promise<number> {
    try {
      const event: SSEEvent = {
        type: input.type,
        data: input.data,
        timestamp: Date.now(),
      };

      if (input.broadcast) {
        return await this.broadcast(event);
      } else if (input.userId) {
        return await this.sendToUser(input.userId, event);
      } else {
        log.warn(
          "No target specified for event (neither userId nor broadcast)",
        );
        return 0;
      }
    } catch (error) {
      handleError("sending event", error);
      return 0;
    }
  }

  /**
   * Get list of active connections
   */
  async getActiveConnections(): Promise<SSEConnection[]> {
    try {
      const connections = await this.manager.getActiveConnections();
      log.info(`Retrieved ${connections.length} active connections`);
      return connections;
    } catch (error) {
      handleError("getting active connections", error);
      return [];
    }
  }

  /**
   * Get count of active connections
   */
  async getConnectionCount(): Promise<number> {
    try {
      const connections = await this.getActiveConnections();
      return connections.length;
    } catch (error) {
      handleError("getting connection count", error);
      return 0;
    }
  }

  /**
   * Send a test event (useful for development/debugging)
   */
  async sendTestEvent(userId?: string): Promise<number> {
    const testEvent = {
      type: "test",
      data: {
        message: "This is a test event",
        timestamp: new Date().toISOString(),
        random: Math.random(),
      },
    };

    if (userId) {
      return await this.sendToUser(userId, testEvent);
    } else {
      return await this.broadcast(testEvent);
    }
  }
}

// Singleton instance
let sseServiceInstance: SSEService | null = null;

export const getSSEService = (): SSEService => {
  sseServiceInstance ??= new SSEService();
  return sseServiceInstance;
};

// Export default instance for convenience
export const sseService = getSSEService();
