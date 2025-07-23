import { useState, useCallback } from "react";

export interface SSEMessage {
  event: string;
  data: unknown;
  timestamp: number;
  id?: string;
}

export const useSSEMessages = () => {
  const [messages, setMessages] = useState<SSEMessage[]>([]);

  const addMessage = useCallback(
    (event: string, data: unknown, id?: string | null) => {
      const message: SSEMessage = {
        event,
        data,
        timestamp: Date.now(),
        id: id ?? undefined,
      };
      setMessages((prev) => [message, ...prev].slice(0, 100)); // Keep last 100 messages
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
