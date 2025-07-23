import { createTRPCRouter, publicProcedure } from "@/lib/trpc";
import { sendEventHandler } from "./handlers/sendEvent";
import { getConnectionsHandler } from "./handlers/getConnections";
import { SendEventInputSchema } from "../types";
import { z } from "zod";

export const sseRouter = createTRPCRouter({
  sendEvent: publicProcedure
    .input(SendEventInputSchema)
    .mutation(sendEventHandler),

  sendTestEvent: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { sseService } = await import("../services/sse-service");
      const count = await sseService.sendTestEvent(input.userId);
      return {
        success: true,
        connectionsReached: count,
        message: `Test event sent to ${count} connections`,
      };
    }),

  getConnections: publicProcedure.query(getConnectionsHandler),
});
