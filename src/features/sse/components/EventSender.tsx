import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";
import { api } from "@/trpc/react";

interface EventSenderProps {
  onEventSent?: () => void;
}

export default function EventSender({ onEventSent }: EventSenderProps) {
  const { t } = useTranslation();
  const [testMessage, setTestMessage] = useState("Hello from SSE!");

  // tRPC mutations
  const sendTestEvent = api.sse.sendTestEvent.useMutation();
  const sendCustomEvent = api.sse.sendEvent.useMutation();

  // Send test event via tRPC
  const handleSendTestEvent = async () => {
    try {
      const result = await sendTestEvent.mutateAsync({});
      console.log("Test event sent:", result);
      onEventSent?.();
    } catch (error) {
      console.error("Failed to send test event:", error);
    }
  };

  // Send custom event via tRPC
  const handleSendCustomEvent = async () => {
    try {
      const result = await sendCustomEvent.mutateAsync({
        type: "custom",
        data: { message: testMessage },
        broadcast: true,
      });
      console.log("Custom event sent:", result);
      onEventSent?.();
    } catch (error) {
      console.error("Failed to send custom event:", error);
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-gray-50 p-4">
      <h3 className="mb-3 font-bold">{t("translation:sse.sendEvents")}</h3>
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Button
            onClick={handleSendTestEvent}
            disabled={sendTestEvent.isPending}
            variant="default"
          >
            {sendTestEvent.isPending
              ? t("translation:sse.sending")
              : t("translation:sse.sendTestEvent")}
          </Button>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder={t("translation:sse.customMessage")}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Button
            onClick={handleSendCustomEvent}
            disabled={sendCustomEvent.isPending}
            variant="outline"
          >
            {sendCustomEvent.isPending
              ? t("translation:sse.sending")
              : t("translation:sse.sendCustom")}
          </Button>
        </div>
      </div>
    </div>
  );
}
