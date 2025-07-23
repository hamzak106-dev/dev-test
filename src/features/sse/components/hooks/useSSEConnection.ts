import { useState, useRef, useEffect, useCallback } from "react";
import {
  ConnectedEventSchema,
  HeartbeatEventSchema,
  TestEventSchema,
  CustomEventSchema,
  NotificationEventSchema,
} from "../schemas/sseEventSchemas";

type MessageHandler = (
  event: string,
  data: unknown,
  id?: string | null,
) => void;

export const useSSEConnection = (onMessage: MessageHandler) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    const eventSource = new EventSource("/api/sse");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("SSE Connected");
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", {
        error,
        readyState: eventSource.readyState,
        url: eventSource.url,
        withCredentials: eventSource.withCredentials,
        CONNECTING: EventSource.CONNECTING,
        OPEN: EventSource.OPEN,
        CLOSED: EventSource.CLOSED,
        timestamp: new Date().toISOString(),
      });

      // Only set disconnected if we're actually closed
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
        setConnectionId(null);
      }
    };

    // Handle connected event
    eventSource.addEventListener("connected", (event) => {
      try {
        const rawData = JSON.parse(
          event.data as string,
        ) as typeof ConnectedEventSchema._type;
        const data = ConnectedEventSchema.parse(rawData);
        setConnectionId(data.connectionId);
        onMessage("connected", data, event.lastEventId);
      } catch (error) {
        console.error("Invalid connected event data:", error);
        onMessage(
          "connected",
          { error: "Invalid data received" },
          event.lastEventId,
        );
      }
    });

    // Handle heartbeat events
    eventSource.addEventListener("heartbeat", (event) => {
      try {
        const rawData = JSON.parse(
          event.data as string,
        ) as typeof HeartbeatEventSchema._type;
        const data = HeartbeatEventSchema.parse(rawData);
        onMessage("heartbeat", data, event.lastEventId);
      } catch (error) {
        console.error("Invalid heartbeat event data:", error);
        onMessage(
          "heartbeat",
          { error: "Invalid data received" },
          event.lastEventId,
        );
      }
    });

    // Handle test events
    eventSource.addEventListener("test", (event) => {
      try {
        const rawData = JSON.parse(
          event.data as string,
        ) as typeof TestEventSchema._type;
        const data = TestEventSchema.parse(rawData);
        onMessage("test", data, event.lastEventId);
      } catch (error) {
        console.error("Invalid test event data:", error);
        onMessage(
          "test",
          { error: "Invalid data received" },
          event.lastEventId,
        );
      }
    });

    // Handle custom events
    eventSource.addEventListener("custom", (event) => {
      try {
        const rawData = JSON.parse(
          event.data as string,
        ) as typeof CustomEventSchema._type;
        const data = CustomEventSchema.parse(rawData);
        onMessage("custom", data, event.lastEventId);
      } catch (error) {
        console.error("Invalid custom event data:", error);
        onMessage(
          "custom",
          { error: "Invalid data received" },
          event.lastEventId,
        );
      }
    });

    // Handle notification events
    eventSource.addEventListener("notification", (event) => {
      try {
        const rawData = JSON.parse(
          event.data as string,
        ) as typeof NotificationEventSchema._type;
        const data = NotificationEventSchema.parse(rawData);
        onMessage("notification", data, event.lastEventId);
      } catch (error) {
        console.error("Invalid notification event data:", error);
        onMessage(
          "notification",
          { error: "Invalid data received" },
          event.lastEventId,
        );
      }
    });
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setConnectionId(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionId,
    connect,
    disconnect,
  };
};
