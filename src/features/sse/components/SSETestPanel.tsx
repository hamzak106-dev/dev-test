"use client";

import { useTranslation } from "react-i18next";
import { api } from "@/trpc/react";
import { useSSEMessages } from "./hooks/useSSEMessages";
import { useSSEConnection } from "./hooks/useSSEConnection";
import ConnectionStatus from "./ConnectionStatus";
import EventSender from "./EventSender";
import MessageList from "./MessageList";

export default function SSETestPanel() {
  const { t } = useTranslation();

  // Custom hooks for focused concerns
  const { messages, addMessage, clearMessages } = useSSEMessages();
  const { isConnected, connectionId, connect, disconnect } =
    useSSEConnection(addMessage);

  // tRPC query for connection data
  const { data: connectionData, refetch: refetchConnections } =
    api.sse.getConnections.useQuery();

  // Handle event sent callback to refresh connection data
  const handleEventSent = () => {
    void refetchConnections();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold">
          {t("translation:sse.testPanel")}
        </h2>

        <ConnectionStatus
          isConnected={isConnected}
          connectionId={connectionId}
          activeConnections={connectionData?.count}
          onConnect={connect}
          onDisconnect={disconnect}
          onRefresh={() => void refetchConnections()}
        />

        <EventSender onEventSent={handleEventSent} />

        <MessageList messages={messages} onClear={clearMessages} />
      </div>
    </div>
  );
}
