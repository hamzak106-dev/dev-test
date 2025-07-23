/**
 * Public API for the SSE (Server-Sent Events) module - CLIENT SIDE
 * This file exports only the components, hooks, and types that should be
 * accessible to client-side parts of the application.
 */

// Test UI component (client-side React component)
export { default as SSETestPanel } from "./components/SSETestPanel";

// Types for external usage (safe to import on client)
export type {
  SSEEvent,
  SSEConnection,
  SendEventInput,
  SSEEventInput,
} from "./types";
