import { TranslationProvider, getLanguage } from "@/features/i18n";
import SSETestPageContent from "./SSETestPageContent";

const I18N_NAMESPACES = ["translation"];

export default async function SSETestPage() {
  const language = await getLanguage();

  return (
    <TranslationProvider language={language} namespaces={I18N_NAMESPACES}>
      <SSETestPageContent />
    </TranslationProvider>
  );
}
