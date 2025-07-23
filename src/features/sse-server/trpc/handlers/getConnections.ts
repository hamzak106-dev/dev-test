import { createServiceContext } from "@/utils/service-utils";
import { TRPCError } from "@trpc/server";
import { sseService } from "../../services/sse-service";

const { log } = createServiceContext("SSEGetConnectionsHandler");

export const getConnectionsHandler = async () => {
  log.info("Getting active SSE connections via tRPC");

  try {
    // First try to get the count (simpler operation)
    const count = await sseService.getConnectionCount();

    // Then try to get connections with additional error handling
    let connections: Awaited<
      ReturnType<typeof sseService.getActiveConnections>
    >;
    try {
      connections = await sseService.getActiveConnections();
    } catch (connectionError) {
      log.warn(
        "Error getting active connections, falling back to empty list:",
        connectionError,
      );
      connections = [];
    }

    return {
      connections,
      count,
      timestamp: Date.now(),
    };
  } catch (error) {
    log.error("getting SSE connections via tRPC", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get SSE connections",
    });
  }
};
