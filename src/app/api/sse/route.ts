import { type NextRequest } from "next/server";
import { getSSEManager } from "@/features/sse-server";
import { createServiceContext } from "@/utils/service-utils";

const { log } = createServiceContext("SSERoute");

/**
 * SSE endpoint for real-time client connections
 * Accepts GET requests and maintains persistent connections
 */
export async function GET(request: NextRequest) {
  try {
    log.info("New SSE connection requested");

    // Generate unique connection ID
    const connectionId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

    // Extract optional user ID from query params (if available)
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? "test";

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller: ReadableStreamDefaultController<Uint8Array>) {
        log.info(`SSE connection starting: ${connectionId}`, { userId });

        // Set up SSE headers and initial connection
        const encoder = new TextEncoder();

        // Send initial connection event
        const initialEvent = `id: ${connectionId}-init\nevent: connected\ndata: ${JSON.stringify(
          {
            connectionId,
            timestamp: Date.now(),
            message: "SSE connection established",
          },
        )}\n\n`;

        controller.enqueue(encoder.encode(initialEvent));

        // Add connection to manager
        const sseManager = getSSEManager();
        void sseManager.addConnection(connectionId, userId, controller);

        // Handle connection cleanup on close
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        request.signal.addEventListener("abort", async () => {
          log.info(`SSE connection closed: ${connectionId}`);
          await sseManager.removeConnection(connectionId);
        });
      },

      cancel() {
        log.info(`SSE connection cancelled: ${connectionId}`);
        const sseManager = getSSEManager();
        void sseManager.removeConnection(connectionId);
      },
    });

    // Return response with proper SSE headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    log.error("Error in SSE endpoint:", error);
    return new Response(
      JSON.stringify({ error: "Failed to establish SSE connection" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Handle preflight requests for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
