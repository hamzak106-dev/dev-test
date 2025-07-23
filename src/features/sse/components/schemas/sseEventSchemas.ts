import { z } from "zod";

// Zod schemas for SSE event validation
export const ConnectedEventSchema = z.object({
  connectionId: z.string(),
  timestamp: z.number(),
  message: z.string(),
});

export const HeartbeatEventSchema = z.object({
  timestamp: z.number(),
});

export const TestEventSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  random: z.number(),
});

export const CustomEventSchema = z.object({
  message: z.string(),
});

export const NotificationEventSchema = z.record(z.unknown());

// Type exports
export type ConnectedEventData = z.infer<typeof ConnectedEventSchema>;
export type HeartbeatEventData = z.infer<typeof HeartbeatEventSchema>;
export type TestEventData = z.infer<typeof TestEventSchema>;
export type CustomEventData = z.infer<typeof CustomEventSchema>;
export type NotificationEventData = z.infer<typeof NotificationEventSchema>;
