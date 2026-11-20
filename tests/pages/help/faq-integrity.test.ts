import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { hi } from "@/lib/i18n/hi";
import { id } from "@/lib/i18n/id";
import { pt } from "@/lib/i18n/pt";
import {
  ALL_FAQS,
  FAQ_ON_PAGES,
  SUPPORT_PAGE_CONTENT,
} from "@/pages/help/constants";

const english = en.translation as Record<string, string>;

/**
 * FAQ lists reference FAQs by id, and FAQs reference copy by i18n key. A typo
 * or a removed FAQ would silently drop a question from Help, so check every
 * link resolves.
 */
describe("Help FAQs", () => {
  it("has unique ids", () => {
    const ids = ALL_FAQS.map((faq) => faq.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has English copy for every question, answer and link label", () => {
    const missing = ALL_FAQS.flatMap((faq) =>
      [faq.questionKey, faq.answerKey, faq.linkLabelKey]
        .filter((key): key is string => Boolean(key))
        .filter((key) => !english[key]),
    );
    expect(missing).toEqual([]);
  });

  it("only lists FAQ ids that exist", () => {
    const known = new Set(ALL_FAQS.map((faq) => faq.id));
    const lists = [
      ...Object.values(SUPPORT_PAGE_CONTENT),
      ...Object.values(FAQ_ON_PAGES),
    ];
    const dangling = lists
      .flatMap((list) => list.faqIds)
      .filter((id) => !known.has(id));
    expect(dangling).toEqual([]);
  });

  it("is translated in every language, with the same placeholders", () => {
    const keys = ALL_FAQS.flatMap((faq) => [faq.questionKey, faq.answerKey]);
    const placeholders = (text: string) =>
      (text.match(/\{\{\w+\}\}/g) ?? []).sort().join(",");
    for (const [name, locale] of Object.entries({ es, pt, id, hi })) {
      const translation = locale.translation as Record<string, string>;
      const problems = keys.filter(
        (key) =>
          !translation[key] ||
          placeholders(translation[key]) !== placeholders(english[key]),
      );
      expect(problems, name).toEqual([]);
    }
  });
});
