import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components";
import { FAQAccordion } from "@/components/faq-accordion";
import { SectionHeader } from "@/components/section-header";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { SearchInput } from "./components/search-input";
import { ALL_FAQS } from "./constants";

export function FAQsSearch() {
  const { t } = useTranslation();
  const { track } = useAnalytics();
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

        <section className="flex w-full flex-col justify-between gap-4 py-4">
          <SectionHeader title={t("FAQS")} />
          <FAQAccordion faqs={filteredFAQs} showAll={true} />
        </section>
      </main>
    </>
  );
}
