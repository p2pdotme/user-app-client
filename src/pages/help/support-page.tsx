import { useTranslation } from "react-i18next";
import { FAQAccordion, NonHomeHeader, SectionHeader } from "@/components";
import { useAnalytics, usePageMeta, useSupportChat } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { ChatButton } from "./components/chat-button";
import { getSupportPageFAQs, type SupportPageTitle } from "./constants";

export function SupportPage({ title }: { title: string }) {
  const { t } = useTranslation();
  usePageMeta({
    title: t("HELP_AND_SUPPORT"),
    description: t("SEO_DESCRIPTION_HELP"),
  });
  const { track } = useAnalytics();
  const { openSupportChat } = useSupportChat();
  const faqs = getSupportPageFAQs(title as SupportPageTitle);

  return (
    <>
      <NonHomeHeader title={t("HELP_AND_SUPPORT")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto">
        <div className="flex flex-1 flex-col gap-2">
          <section className="flex w-full flex-col items-center justify-center gap-4 py-8">
            <h3 className="font-medium text-lg">
              {t(title.toUpperCase().replace(/-/g, "_"))}
            </h3>
          </section>

          <section className="flex w-full flex-col justify-between gap-4 py-4">
            <SectionHeader
              title={t("FAQS")}
              seeAllLink={INTERNAL_HREFS.HELP_FAQS_SEARCH}
            />
            <div className="relative w-full">
              <FAQAccordion faqs={faqs} showAll={true} />
            </div>
          </section>
        </div>

        <section className="mt-auto flex w-full flex-row items-center justify-between gap-4 py-4">
          <span className="w-1/2 font-regular text-sm">
            {t("DIDNT_FIND_WHAT_YOU_RE_LOOKING_FOR")}
          </span>
          <ChatButton
            className="w-1/2"
            onClick={() => {
              track(EVENTS.HELP, {
                status: "telegram_support_clicked",
                section: title,
              });
              openSupportChat();
            }}
          />
        </section>
      </main>
    </>
  );
}
