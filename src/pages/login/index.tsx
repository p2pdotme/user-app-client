import { CircleHelp, Globe, Loader2, MailCheck } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
// Imported directly (not via ASSETS) so this ~240 KB illustration ships with
// the login screen only, not in the startup bundle.
import { LoginPoster } from "@/assets/images/login-poster";
import { TextLogo } from "@/components/text-logo";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/settings";
import type { Currency, Language } from "@/core/client/settings";
import {
  useAnalytics,
  useGeoLocale,
  useHapticInteractions,
  usePageMeta,
  useThirdweb,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import {
  COUNTRY_OPTIONS,
  getCurrencyLabel,
  getFiatUnit,
  INTERNAL_HREFS,
  LANGUAGE_OPTIONS,
  STORAGE_KEYS,
  URLS,
} from "@/lib/constants";
import { getStoredParams, hasStoredParams } from "@/lib/url-param-preservation";

// Choices a returning (logged-out) user already made. Empty when this is a
// first run — geolocation then supplies the defaults (see useGeoLocale below).
const getStoredSelections = (): { language: string; currency: string } => {
  const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!existingSettings) return { language: "", currency: "" };
  try {
    const settings = JSON.parse(existingSettings);
    return {
      language: settings.language?.code || "",
      // Only a consciously confirmed currency counts as the user's choice.
      currency: settings.isCurrencyConfirmed
        ? settings.currency?.currency || ""
        : "",
    };
  } catch {
    return { language: "", currency: "" };
  }
};

// Social platform icon mapping
const getSocialPlatformIcon = (platform: string | undefined) => {
  if (!platform) return null;

  switch (platform) {
    case "X":
      return (
        <ASSETS.ICONS.Twitter className="size-24 animate-pulse text-foreground" />
      );
    case "Instagram":
      return (
        <ASSETS.ICONS.Instagram className="size-24 animate-pulse text-foreground" />
      );
    case "LinkedIn":
      return (
        <ASSETS.ICONS.Linkedin className="size-24 animate-pulse text-foreground" />
      );
    case "GitHub":
      return (
        <ASSETS.ICONS.Github className="size-24 animate-pulse text-foreground" />
      );
    case "Facebook":
      return (
        <ASSETS.ICONS.Facebook className="size-24 animate-pulse text-foreground" />
      );
    default:
      return null;
  }
};

// Help is public (see AuthGuard isPublicRoute), so people stuck before login
// can still reach FAQs, guides and support.
function NeedHelpLink() {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  return (
    <Link
      to={INTERNAL_HREFS.HELP}
      onClick={() =>
        track(EVENTS.HELP, { status: "opened", section: "login_need_help" })
      }
      className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm underline-offset-4 hover:text-primary hover:underline">
      <CircleHelp className="size-4" />
      {t("ONB_NEED_HELP_LINK")}
    </Link>
  );
}

export function LoginPage() {
  const { t, i18n } = useTranslation();
  usePageMeta({ title: t("LOGIN"), description: t("SEO_DESCRIPTION_LOGIN") });
  const [language, setLanguage] = React.useState<string>("");
  const { connect, connectionStatus, isAutoConnectLoading } = useThirdweb();
  const { track } = useAnalytics();

  // Prefer newer, plainer copy where it has been translated for the current
  // language; otherwise keep the existing (translated) string rather than
  // dropping a non-English user to English.
  const hasOwnTranslation = (key: string) =>
    i18n.getResource(
      i18n.resolvedLanguage ?? i18n.language,
      "translation",
      key,
    ) !== undefined;
  const tPreferred = (key: string, fallbackKey: string, options = {}) =>
    hasOwnTranslation(key) ? t(key, options) : t(fallbackKey, options);

  React.useEffect(() => {
    track(EVENTS.NAVIGATION, {
      status: "page_viewed",
      page: "login",
      hasStoredParams: hasStoredParams(),
    });
  }, [track]);

  const { setLanguage: setLanguageSettings, setCurrency: setCurrencySettings } =
    useSettings();
  const { onValidationError, onSettingSaved } = useHapticInteractions();

  // Local currency selection for login; must be consciously selected by user
  const [currencySymbol, setCurrencySymbol] = React.useState<string>("");

  // Once the user (or their stored settings / a deep link) has set a value,
  // geolocation must not override it.
  const userChose = React.useRef({ currency: false, language: false });

  // Initialize from stored settings on mount
  React.useEffect(() => {
    const stored = getStoredSelections();
    if (stored.language) {
      userChose.current.language = true;
      setLanguage(stored.language);
      i18n.changeLanguage(stored.language);
    }
    if (stored.currency) {
      userChose.current.currency = true;
      setCurrencySymbol(stored.currency);
    }
  }, [i18n]);

  // Default currency and language to the user's market: local timezone/locale
  // guess immediately, refined by Netlify edge geolocation once it answers.
  const geo = useGeoLocale();
  React.useEffect(() => {
    if (!userChose.current.currency && geo.currency) {
      setCurrencySymbol(geo.currency.currency);
    }
    if (!userChose.current.language) {
      setLanguage(geo.language.code);
      i18n.changeLanguage(geo.language.code);
    }
  }, [geo.currency, geo.language, i18n]);

  // Check for stored parameters on mount
  const [pendingAction, setPendingAction] = React.useState<{
    type: "campaign" | "referral" | "verification";
    socialPlatform?: string;
  } | null>(null);

  React.useEffect(() => {
    if (hasStoredParams()) {
      const params = getStoredParams();
      if (params) {
        // Check for campaign parameters
        if (params.manager || params.id) {
          setPendingAction({ type: "campaign" });
        }
        // Check for referral parameters
        else if (params.address && params.nonce && params.signature) {
          setPendingAction({ type: "referral" });
        }
        // Check for verification parameters
        else if (params.sessionId && params.socialPlatform) {
          userChose.current.language = true;
          setLanguage(params.language || "en");
          const currencyOption = COUNTRY_OPTIONS.find(
            (c) => c.currency === (params.currency || ""),
          );
          if (currencyOption) {
            userChose.current.currency = true;
            setCurrencySymbol(currencyOption.currency);
          }
          const languageOption = LANGUAGE_OPTIONS.find(
            (l) => l.code === params.language,
          );
          if (languageOption) {
            i18n.changeLanguage(languageOption.code);
          }
          setPendingAction({
            type: "verification",
            socialPlatform: params.socialPlatform,
          });
        }
      }
    }
  }, [i18n.changeLanguage]);

  const handleLanguageChange = (language: Language) => {
    userChose.current.language = true;
    setLanguage(language.code);
    i18n.changeLanguage(language.code);
    // Note: Select component already provides haptic feedback for selection changes
  };

  const handleCurrencyChange = (currency: Currency) => {
    userChose.current.currency = true;
    setCurrencySymbol(currency.currency);
    // Note: Select component already provides haptic feedback for selection changes
  };

  const handleConnect = async () => {
    // Validate selections with haptic feedback for errors
    if (!currencySymbol) {
      onValidationError(); // Trigger error haptic for validation failure
      toast.error(t("CURRENCY_REQUIRED"), {
        description: t("PLEASE_SELECT_CURRENCY"),
      });
      return;
    }

    if (!language) {
      onValidationError(); // Trigger error haptic for validation failure
      toast.error(t("LANGUAGE_REQUIRED"), {
        description: t("PLEASE_SELECT_LANGUAGE"),
      });
      return;
    }

    try {
      // Save settings before connecting
      const selectedLanguage = LANGUAGE_OPTIONS.find(
        (l) => l.code === language,
      );
      const selectedCurrency = COUNTRY_OPTIONS.find(
        (c) => c.currency === currencySymbol,
      );

      if (selectedLanguage) {
        await setLanguageSettings(selectedLanguage);
      }
      if (selectedCurrency) {
        await setCurrencySettings(selectedCurrency);
      }
      onSettingSaved(); // Haptic feedback for successful setting save
    } catch (error) {
      // Saving preferences is best-effort; login can still proceed.
      console.error("Failed to save login preferences:", error);
    }

    track(EVENTS.WALLET, {
      status: "login_clicked",
      currency: currencySymbol,
      language,
      pendingAction: pendingAction?.type ?? "none",
    });

    // connect() never throws: cancellation is silent (the button simply
    // stays usable), failures already showed a friendly toast.
    const result = await connect();
    if (result === "connected") {
      // Stored deep-link params (invite / campaign / verification) are
      // consumed by AuthGuard, which restores them after login, so they must
      // NOT be cleared here or the invite would be lost.
      setPendingAction(null);
    } else if (result === "failed") {
      onValidationError(); // Error haptic for a real failure only
    }
  };

  // Loading states
  const isAutoConnecting =
    isAutoConnectLoading && connectionStatus === "disconnected";
  const isManualConnecting = connectionStatus === "connecting";
  const isLoading = isAutoConnecting || isManualConnecting;

  // Render verification UI
  if (pendingAction?.type === "verification") {
    return (
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-8 overflow-y-auto px-4">
        <section className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex size-48 items-center justify-center rounded-full bg-primary/10">
              {getSocialPlatformIcon(pendingAction.socialPlatform)}
            </div>
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-center font-bold text-2xl">
                {t("LOGIN_TO_CONTINUE_VERIFICATION")}
              </h1>
              <p className="text-center text-lg text-muted-foreground">
                {t("CONTINUE_VERIFICATION_FOR_PLATFORM", {
                  platform: pendingAction.socialPlatform,
                })}
              </p>
            </div>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center px-4">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <span className="text-center font-regular text-base text-foreground">
                {t("SELECT_CURRENCY_AND_LANGUAGE")}
              </span>
              <div className="flex w-full gap-3">
                <Select
                  value={currencySymbol}
                  disabled={isLoading}
                  onValueChange={(value) => {
                    const found = COUNTRY_OPTIONS.find(
                      (c) => c.currency === value,
                    );
                    if (found) handleCurrencyChange(found);
                  }}>
                  <SelectTrigger className="w-1/2">
                    <SelectValue placeholder={t("CURRENCY")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.currency} value={c.currency}>
                        <span className="flex items-center gap-2">
                          {c.flag && `${c.flag} • `}
                          {c.symbolNative} •{" "}
                          {getCurrencyLabel(c.currency, c.country)}
                          {c.isAlpha && (
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                              Alpha
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={language}
                  disabled={isLoading}
                  onValueChange={(value) => {
                    const found = LANGUAGE_OPTIONS.find(
                      (l) => l.code === value,
                    );
                    if (found) handleLanguageChange(found);
                  }}>
                  <SelectTrigger className="w-1/2">
                    <span className="flex items-center gap-2 truncate">
                      <Globe className="size-5" />
                      <SelectValue placeholder={t("LANGUAGE")} />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-center font-light text-muted-foreground text-sm">
              {t("LOGIN_AGREE_TERMS")}
              <a
                href={URLS.TERMS_AND_CONDITIONS}
                className="text-primary underline transition-colors hover:text-primary/80"
                tabIndex={0}>
                {t("TERMS_AND_CONDITIONS")}
              </a>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                className="h-12 w-full font-medium text-base"
                size="lg"
                hapticType="success"
                disabled={isLoading || isAutoConnecting}
                onClick={handleConnect}>
                {isAutoConnecting || isManualConnecting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t("CONNECTING_WALLET")}</span>
                  </div>
                ) : (
                  t("LOGIN_TO_CONTINUE")
                )}
              </Button>
              <NeedHelpLink />
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Normal onboarding UI or other pending actions
  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto">
      {pendingAction ? (
        // Other pending actions (campaign, referral)
        <section className="flex w-full flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center gap-2">
            {/* <Loader2 className="text-primary h-32 w-32 animate-spin" /> */}
            <div className="flex items-center justify-center rounded-full bg-primary/10 p-4">
              <span className="flex items-center justify-center rounded-full bg-primary p-4">
                <MailCheck className="size-12 text-background" />
              </span>
            </div>
            <h1 className="text-center font-bold text-2xl">
              {pendingAction.type === "campaign" &&
                t("CAMPAIGN_PARAMS_DETECTED")}
              {pendingAction.type === "referral" &&
                t("REFERRAL_PARAMS_DETECTED")}
            </h1>
          </div>

          <div className="max-w-md text-center text-lg text-muted-foreground">
            {/* The deep link lands on Home with the invite/bonus drawer open,
                not on a separate page, so the copy says exactly that. */}
            {pendingAction.type === "campaign" &&
              t("ONB_CAMPAIGN_PARAMS_DESCRIPTION")}
            {pendingAction.type === "referral" &&
              t("ONB_REFERRAL_PARAMS_DESCRIPTION")}
          </div>
        </section>
      ) : (
        // Normal login UI for first-time users
        <>
          <section className="flex w-full flex-col items-center justify-center gap-2">
            <TextLogo />
            <p className="text-center font-regular text-rg">
              {tPreferred("ONB_LOGIN_PAGE_TITLE", "LOGIN_PAGE_TITLE", {
                currency: getFiatUnit(currencySymbol) || t("YOUR_CURRENCY"),
              })}
            </p>
            {hasOwnTranslation("ONB_LOGIN_USDC_EXPLAINER") && (
              <p className="px-4 text-center text-muted-foreground text-sm">
                {t("ONB_LOGIN_USDC_EXPLAINER")}
              </p>
            )}
          </section>

          <LoginPoster className="pointer-events-none h-72 w-72 select-none object-contain" />
        </>
      )}

      <section className="flex w-full flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <span className="text-center font-regular text-base text-foreground">
              {t("SELECT_CURRENCY_AND_LANGUAGE")}
            </span>
            <div className="flex w-full gap-3">
              <Select
                value={currencySymbol}
                disabled={isLoading}
                onValueChange={(value) => {
                  const found = COUNTRY_OPTIONS.find(
                    (c) => c.currency === value,
                  );
                  if (found) handleCurrencyChange(found);
                }}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder={t("CURRENCY")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.currency} value={c.currency}>
                      <span className="flex items-center gap-2">
                        {c.flag && `${c.flag} • `}
                        {c.symbolNative} •{" "}
                        {getCurrencyLabel(c.currency, c.country)}
                        {c.isAlpha && (
                          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                            Alpha
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={language}
                disabled={isLoading}
                onValueChange={(value) => {
                  const found = LANGUAGE_OPTIONS.find((l) => l.code === value);
                  if (found) handleLanguageChange(found);
                }}>
                <SelectTrigger className="w-1/2">
                  <span className="flex items-center gap-2 truncate">
                    <Globe className="size-5" />
                    <SelectValue placeholder={t("LANGUAGE")} />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-center font-light text-muted-foreground text-sm">
            {t("LOGIN_AGREE_TERMS")}
            <a
              href={URLS.TERMS_AND_CONDITIONS}
              className="text-primary underline transition-colors hover:text-primary/80"
              tabIndex={0}>
              {t("TERMS_AND_CONDITIONS")}
            </a>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              className="h-12 w-full font-medium text-base"
              size="lg"
              hapticType="success" // Use success haptic for login action
              disabled={isLoading || isAutoConnecting}
              onClick={handleConnect}>
              {isAutoConnecting || isManualConnecting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("CONNECTING_WALLET")}</span>
                </div>
              ) : pendingAction && pendingAction.type === "campaign" ? (
                t("LOGIN_TO_CONTINUE")
              ) : pendingAction && pendingAction.type === "referral" ? (
                t("LOGIN_TO_CONTINUE")
              ) : (
                t("LOGIN")
              )}
            </Button>
            <NeedHelpLink />
          </div>
        </div>
      </section>
    </main>
  );
}
