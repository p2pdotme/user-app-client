import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currencyForCountry,
  detectCountryLocal,
  detectCurrency,
  languageForCountry,
  resolveLanguage,
} from "@/core/client/locale-detection";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

const setTimezone = (timeZone: string | undefined) =>
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);

const setBrowserLanguages = (languages: string[]) => {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
  vi.spyOn(navigator, "language", "get").mockReturnValue(languages[0] ?? "");
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("currencyForCountry", () => {
  it("maps SDK market countries derived from their reference locale", () => {
    expect(currencyForCountry("IN")?.currency).toBe("INR");
    expect(currencyForCountry("ar")?.currency).toBe("ARS");
    expect(currencyForCountry("BR")?.currency).toBe("BRL");
    expect(currencyForCountry("KE")?.currency).toBe("KES");
  });

  it("maps the wider eurozone to EUR only while EUR is an enabled market", () => {
    const expected = SUPPORTED_CURRENCIES.includes("EUR") ? "EUR" : undefined;
    expect(currencyForCountry("FR")?.currency).toBe(expected);
    expect(currencyForCountry("DE")?.currency).toBe(expected);
  });

  it("returns undefined outside supported markets", () => {
    expect(currencyForCountry("GB")).toBeUndefined();
    expect(currencyForCountry("")).toBeUndefined();
  });
});

describe("languageForCountry", () => {
  it("derives the market language from the reference locale", () => {
    expect(languageForCountry("AR")?.code).toBe("es");
    expect(languageForCountry("BR")?.code).toBe("pt");
    expect(languageForCountry("ID")?.code).toBe("id");
    expect(languageForCountry("IN")?.code).toBe("en");
  });

  it("is undefined for markets whose language the app doesn't ship", () => {
    expect(languageForCountry("DE")).toBeUndefined();
    expect(languageForCountry("ZZ")).toBeUndefined();
  });
});

describe("detectCountryLocal / detectCurrency", () => {
  it("prefers the timezone over an en-US browser locale", () => {
    setTimezone("America/Argentina/Buenos_Aires");
    setBrowserLanguages(["en-US"]);
    expect(detectCountryLocal()).toBe("AR");
    expect(detectCurrency()?.currency).toBe("ARS");
  });

  it("falls back to the browser locale region when the timezone is unknown", () => {
    setTimezone("Europe/London");
    setBrowserLanguages(["en-GB", "hi-IN"]);
    expect(detectCountryLocal()).toBe("IN");
    expect(detectCurrency()?.currency).toBe("INR");
  });

  it("returns undefined when nothing hints at a supported market", () => {
    setTimezone("Europe/London");
    setBrowserLanguages(["en-GB"]);
    expect(detectCountryLocal()).toBeUndefined();
    expect(detectCurrency()).toBeUndefined();
  });
});

describe("resolveLanguage", () => {
  it("lets an explicit non-English browser language win over the market", () => {
    setBrowserLanguages(["hi-IN"]);
    expect(resolveLanguage("AR").code).toBe("hi");
  });

  it("uses the market language when the browser is only English", () => {
    setBrowserLanguages(["en-US"]);
    expect(resolveLanguage("AR").code).toBe("es");
    expect(resolveLanguage("BR").code).toBe("pt");
  });

  it("falls back to the browser language, then English", () => {
    setBrowserLanguages(["en-US"]);
    expect(resolveLanguage("DE").code).toBe("en");
    expect(resolveLanguage(null).code).toBe("en");
    setBrowserLanguages(["fr-FR"]);
    expect(resolveLanguage(undefined).code).toBe("en");
  });
});
