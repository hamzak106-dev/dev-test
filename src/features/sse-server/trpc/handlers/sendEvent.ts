import { createServiceContext } from "@/utils/service-utils";
import { TRPCError } from "@trpc/server";
import { sseService } from "../../services/sse-service";
import type { SendEventInput } from "../../types";

const { log } = createServiceContext("SSESendEventHandler");

export const sendEventHandler = async ({
  input,
}: {
  input: SendEventInput;
}) => {
  log.info("Sending SSE event via tRPC", {
    type: input.type,
    userId: input.userId,
    broadcast: input.broadcast,
  });

  try {
    const count = await sseService.sendEvent(input);

    return {
      success: true,
      connectionsReached: count,
      message: `Event sent to ${count} connections`,
    };
  } catch (error) {
    log.error("sending SSE event via tRPC", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to send SSE event",
    });
  }
};
