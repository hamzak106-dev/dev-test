"use client";

import { SSETestPanel } from "@/features/sse";
import { Button } from "@/shared/components/ui/button";
import { cookieName } from "@/config/i18n";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const setLanguageCookie = (value: string) => {
  document.cookie = `${cookieName}=${value}`;
};

export default function SSETestPageContent() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-100 py-8 text-black">
      <div className="container mx-auto">
        {/* Language Switcher */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const newLanguage = i18n.resolvedLanguage === "en" ? "de" : "en";
              await i18n.changeLanguage(newLanguage);
              setLanguageCookie(newLanguage);
              router.refresh();
            }}
          >
            {i18n.resolvedLanguage === "en" ? "🇩🇪 Deutsch" : "🇺🇸 English"}
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {t("translation:sse.demoTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            {t("translation:sse.demoDescription")}
          </p>
        </div>

        <SSETestPanel />

        <div className="mx-auto mt-8 max-w-4xl p-6">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">
              {t("translation:sse.howItWorks")}
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>{t("translation:sse.stepConnect")}</strong>{" "}
                {t("translation:sse.step1")}
              </p>
              <p>
                <strong>{t("translation:sse.stepSendEvents")}</strong>{" "}
                {t("translation:sse.step2")}
              </p>
              <p>
                <strong>{t("translation:sse.stepRealtime")}</strong>{" "}
                {t("translation:sse.step3")}
              </p>
              <p>
                <strong>{t("translation:sse.stepBackend")}</strong>{" "}
                {t("translation:sse.step4")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
