import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SectionHeader } from "@/components";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { SearchInput } from "./search-input";

export const FAQSearchSection = () => {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const navigate = useNavigate();

  return (
    <section className="flex w-full flex-col justify-between gap-4 py-4">
      <Button
        variant="ghost"
        className="flex h-fit w-full cursor-pointer flex-col justify-between gap-4 p-0"
        onClick={() => {
          track(EVENTS.HELP, { status: "opened", section: "faqs-search" });
          navigate("/help/faqs-search");
        }}
        aria-label={t("FAQS")}>
        <SectionHeader title={t("FAQS")} />
        <SearchInput readOnly value="" onChange={() => {}} />
      </Button>
    </section>
  );
};
