/**
 * Server-side API for the SSE (Server-Sent Events) module
 * This file exports server-only components like tRPC routers, database integrations, etc.
 * DO NOT import this file from client-side components.
 */

// tRPC router for API integration (server-side only)
export { sseRouter } from "./trpc/router";

// Server-side services and managers
export { getSSEManager, SSEManager } from "./services/sse-manager";
export { sseService, getSSEService, SSEService } from "./services/sse-service";

// Types that might be needed on server-side
export type {
  SSEEvent,
  SSEConnection,
  SendEventInput,
  SSEEventInput,
  SSEManagerInterface,
} from "./types";
