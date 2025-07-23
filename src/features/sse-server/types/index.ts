import { z } from "zod";

/**
 * SSE Event structure
 */
export interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: number;
  id?: string;
}

/**
 * SSE Connection information
 */
export interface SSEConnection {
  id: string;
  userId?: string;
  connectedAt: number;
  lastHeartbeat: number;
}

/**
 * SSE Manager interface
 */
export interface SSEManagerInterface {
  addConnection(
    connectionId: string,
    userId?: string,
    controller?: ReadableStreamDefaultController<Uint8Array>,
  ): Promise<void>;
  removeConnection(connectionId: string): Promise<void>;
  sendEvent(connectionId: string, event: SSEEvent): Promise<boolean>;
  sendEventToUser(userId: string, event: SSEEvent): Promise<number>;
  broadcastEvent(event: SSEEvent): Promise<number>;
  getActiveConnections(): Promise<SSEConnection[]>;
  cleanup(): Promise<void>;
}

/**
 * Zod schemas for validation
 */
export const SSEEventSchema = z.object({
  type: z.string().min(1),
  data: z.unknown(),
  timestamp: z.number().optional(),
  id: z.string().optional(),
});

export const SendEventInputSchema = z.object({
  type: z.string().min(1),
  data: z.unknown(),
  userId: z.string().optional(),
  broadcast: z.boolean().default(false),
});

export type SendEventInput = z.infer<typeof SendEventInputSchema>;
export type SSEEventInput = z.infer<typeof SSEEventSchema>;
