import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionId: string | null;
  activeConnections?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh?: () => void;
}

export default function ConnectionStatus({
  isConnected,
  connectionId,
  activeConnections,
  onConnect,
  onDisconnect,
  onRefresh,
}: ConnectionStatusProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Connection Status */}
      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{t("translation:sse.status")}: </span>
            <span
              className={`font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}
            >
              {isConnected
                ? t("translation:sse.connected")
                : t("translation:sse.disconnected")}
            </span>
            {connectionId && (
              <span className="ml-4 text-sm text-gray-600">
                {t("translation:sse.connectionId")}: {connectionId}
              </span>
            )}
          </div>
          <div className="space-x-2">
            <Button
              onClick={onConnect}
              disabled={isConnected}
              variant={isConnected ? "secondary" : "default"}
            >
              {t("translation:sse.connect")}
            </Button>
            <Button
              onClick={onDisconnect}
              disabled={!isConnected}
              variant="outline"
            >
              {t("translation:sse.disconnect")}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Connections Info */}
      {activeConnections !== undefined && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                {t("translation:sse.activeConnections")}:{" "}
              </span>
              <span className="font-bold text-blue-600">
                {activeConnections}
              </span>
            </div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                {t("translation:sse.refresh")}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
