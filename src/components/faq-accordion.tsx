import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";

interface FAQ {
  id: string;
  questionKey: string;
  answerKey: string;
  excludedFrom?: string[];
  onlyForCurrencies?: string[];
}

interface FAQAccordionProps {
  faqs: FAQ[];
  showAll?: boolean;
}

export const FAQAccordion = ({ faqs, showAll = false }: FAQAccordionProps) => {
  const { track } = useAnalytics();
  const { t, i18n } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();

  // Calculate yearly volume limit based on currency
  const getYearlyVolumeLimit = (currencySymbol: string) => {
    const limits: Record<string, number> = {
      BRL: 50000,
      ARS: 100000,
      INR: 50000,
      IDR: 50000,
      MEX: 50000,
      VEN: 50000,
    };
    return limits[currencySymbol] || 50000; // Default fallback
  };

  const filteredFaqs = faqs.filter((faq) => {
    const isExcluded = faq.excludedFrom?.includes(i18n.language);
    const isCurrencyRestricted =
      faq.onlyForCurrencies &&
      !faq.onlyForCurrencies.includes(currency.currency);
    return !isExcluded && !isCurrencyRestricted;
  });

  const faqsToShow = showAll ? filteredFaqs : filteredFaqs.slice(0, 3);

  return (
    <Accordion type="single" collapsible>
      {faqsToShow.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger
            onClick={() =>
              track(EVENTS.HELP, {
                status: "faq_opened",
                faqId: faq.id,
                question: faq.questionKey,
              })
            }>
            <p>{t(faq.questionKey)}</p>
          </AccordionTrigger>
          <AccordionContent className="whitespace-pre-line">
            {t(faq.answerKey, {
              yearlyVolumeLimit: getYearlyVolumeLimit(
                currency.currency,
              ).toLocaleString(),
            })}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
