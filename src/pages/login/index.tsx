import { Fingerprint, Globe, Loader2, MailCheck } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
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
import { useHapticInteractions, useThirdweb } from "@/hooks";
import {
  COUNTRY_OPTIONS,
  CURRENCY,
  LANGUAGE_OPTIONS,
  STORAGE_KEYS,
  URLS,
} from "@/lib/constants";
import {
  clearStoredParams,
  getStoredParams,
  hasStoredParams,
} from "@/lib/url-param-preservation";

// Helper function to detect browser language
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language?.split("-")[0] || "en";
  return (
    LANGUAGE_OPTIONS.find((lang) => lang.code === browserLang)?.code || "en"
  );
};

// Helper function to get initial language
const getInitialLanguage = (): string => {
  const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (existingSettings) {
    try {
      const settings = JSON.parse(existingSettings);
      return settings.language?.code || "en";
    } catch {
      return "en";
    }
  }
  return getBrowserLanguage();
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
    case "Aadhaar":
      return <Fingerprint className="size-24 animate-pulse text-foreground" />;
    default:
      return null;
  }
};

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = React.useState<string>("");
  const { connect, connectionStatus, isAutoConnectLoading } = useThirdweb();

  const { setLanguage: setLanguageSettings, setCurrency: setCurrencySettings } =
    useSettings();
  const { onValidationError, onSettingSaved } = useHapticInteractions();

  // Local currency selection for login; must be consciously selected by user
  const [currencySymbol, setCurrencySymbol] = React.useState<string>("");

  // Initialize language on mount
  React.useEffect(() => {
    const initialLanguage = getInitialLanguage();
    setLanguage(initialLanguage);

    const languageOption = LANGUAGE_OPTIONS.find(
      (l) => l.code === initialLanguage,
    );
    if (languageOption) {
      i18n.changeLanguage(languageOption.code);
    }
  }, [i18n]);

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
          setLanguage(params.language || "en");
          const currencyOption = COUNTRY_OPTIONS.find(
            (c) => c.currency === (params.currency || ""),
          );
          if (currencyOption) {
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
    setLanguage(language.code);
    i18n.changeLanguage(language.code);
    // Note: Select component already provides haptic feedback for selection changes
  };

  const handleCurrencyChange = (currency: Currency) => {
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

      await connect();
      // Clear stored parameters and pending action after successful login
      clearStoredParams();
      setPendingAction(null);
      // Note: Success haptic for login will be handled by the Button component
      // since we're using hapticType="success" for the login button
    } catch (error) {
      onValidationError(); // Trigger error haptic for login failure
      console.error("Login failed:", error);
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
                          {c.currency === CURRENCY.USD ||
                          c.currency === CURRENCY.EUR
                            ? `${c.country}`
                            : c.currency}
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
            {pendingAction.type === "campaign" &&
              t("CAMPAIGN_PARAMS_DESCRIPTION")}
            {pendingAction.type === "referral" &&
              t("REFERRAL_PARAMS_DESCRIPTION")}
          </div>
        </section>
      ) : (
        // Normal login UI for first-time users
        <>
          <section className="flex w-full flex-col items-center justify-center gap-2">
            <TextLogo />
            <p className="text-center font-regular text-rg">
              {t("LOGIN_PAGE_TITLE", {
                currency: currencySymbol || t("YOUR_CURRENCY"),
              })}
            </p>
          </section>

          <ASSETS.IMAGES.LoginPoster className="pointer-events-none h-72 w-72 select-none object-contain" />
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
                        {c.currency === CURRENCY.USD ||
                        c.currency === CURRENCY.EUR
                          ? `${c.country}`
                          : c.currency}
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
          </div>
        </div>
      </section>
    </main>
  );
}
