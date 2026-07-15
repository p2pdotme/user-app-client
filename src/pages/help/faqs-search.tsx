import { Bot } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { FAQAccordion } from "@/components/faq-accordion";
import { SectionHeader } from "@/components/section-header";
import { useSettings } from "@/contexts";
import { useAnalytics, useThirdweb } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { openAiSupportChat } from "@/lib/support-chat";
import { SearchInput } from "./components/search-input";
import { ALL_FAQS } from "./constants";

export function FAQsSearch() {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();
  const { account } = useThirdweb();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter FAQs based on search query
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return ALL_FAQS;

    const query = searchQuery.toLowerCase();
    return ALL_FAQS.filter((faq) => {
      const translatedQuestion = t(faq.questionKey).toLowerCase();
      const translatedAnswer = t(faq.answerKey).toLowerCase();
      return (
        translatedQuestion.includes(query) || translatedAnswer.includes(query)
      );
    });
  }, [searchQuery, t]);

  return (
    <>
      <NonHomeHeader title={t("Search FAQS")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto">
        <section className="flex w-full flex-col gap-4 py-4">
          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              const query = e.target.value;
              setSearchQuery(query);
              if (query.length > 2) {
                track(EVENTS.HELP, {
                  status: "search_query",
                  query,
                  resultsCount: ALL_FAQS.filter((faq) => {
                    const translatedQuestion = t(faq.questionKey).toLowerCase();
                    const translatedAnswer = t(faq.answerKey).toLowerCase();
                    return (
                      translatedQuestion.includes(query.toLowerCase()) ||
                      translatedAnswer.includes(query.toLowerCase())
                    );
                  }).length,
                });
              }
            }}
            autoFocus
          />
          <div className="flex w-full flex-col gap-2">
            <p className="font-regular text-sm">
              {searchQuery ? (
                <>
                  Results for{" "}
                  <span className="text-green-600">"{searchQuery}"</span>
                </>
              ) : null}
            </p>
          </div>
        </section>

        {searchQuery.trim() && filteredFAQs.length === 0 ? (
          <section className="flex w-full flex-col gap-3 py-4">
            <p className="font-regular text-muted-foreground text-sm">
              {t("NO_FAQ_RESULTS")}
            </p>
            <button
              type="button"
              onClick={() => {
                track(EVENTS.HELP, {
                  status: "ai_fallback",
                  query: searchQuery,
                });
                openAiSupportChat(
                  currency.currency || "global",
                  account?.address,
                  searchQuery,
                );
              }}
              className="flex w-full items-center justify-between gap-4 rounded-lg bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15">
              <div className="flex items-center gap-2">
                <Bot className="size-4 shrink-0 text-primary" />
                <span className="font-medium text-primary text-sm">
                  {t("ASK_AI_ABOUT", { query: searchQuery })}
                </span>
              </div>
            </button>
          </section>
        ) : (
          <section className="flex w-full flex-col justify-between gap-4 py-4">
            <SectionHeader title={t("FAQS")} />
            <FAQAccordion faqs={filteredFAQs} showAll={true} />
          </section>
        )}
      </main>
    </>
  );
}
