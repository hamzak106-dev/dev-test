import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";
import type { SSEMessage } from "./hooks/useSSEMessages";

interface MessageListProps {
  messages: SSEMessage[];
  onClear: () => void;
}

export default function MessageList({ messages, onClear }: MessageListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          {t("translation:sse.messages")} ({messages.length})
        </h3>
        <Button onClick={onClear} variant="outline" size="sm">
          {t("translation:sse.clear")}
        </Button>
      </div>

      <div className="h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t("translation:sse.noMessages")}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className="rounded border-l-4 border-blue-500 bg-gray-50 p-3"
            >
              <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                <span className="font-medium">{message.event}</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="overflow-x-auto text-sm">
                {JSON.stringify(message.data, null, 2)}
              </pre>
              {message.id && (
                <div className="mt-1 text-xs text-gray-500">
                  {t("translation:sse.connectionId")}: {message.id}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
