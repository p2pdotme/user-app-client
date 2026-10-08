import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect } from "react";
import {
  currencyForCountry,
  resolveLanguage,
} from "@/core/client/locale-detection";
import {
  type Currency,
  createDefaultSettings,
  getResolvedTheme,
  getSettings,
  type Language,
  resetSettings,
  type Settings,
  type Theme,
  updateCurrency,
  updateDevMode,
  updateHaptics,
  updateLanguage,
  updateSettings,
  updateSounds,
  updateTheme,
} from "@/core/client/settings";
import { geoCountryQuery } from "@/lib/geo";
import { i18n } from "@/lib/i18n";
import { setMomentLocale } from "@/lib/moment-locale";
import { updatePWATheme } from "@/lib/utils";

interface SettingsContextValue {
  // State
  settings: Settings;
  isLoading: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  set: (updates: Partial<Settings>) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setSounds: (sounds: Settings["sounds"]) => Promise<void>;
  setHaptics: (haptics: Settings["haptics"]) => Promise<void>;
  setDevMode: (devMode: Settings["devMode"]) => Promise<void>;
  reset: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: createDefaultSettings(),
  isLoading: false,
  error: null,
  refresh: async () => {},
  set: async () => {},
  setCurrency: async () => {},
  setLanguage: async () => {},
  setTheme: async () => {},
  setSounds: async () => {},
  setHaptics: async () => {},
  setDevMode: async () => {},
  reset: async () => {},
});

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

/**
 * Apply theme to document root and update PWA theme color
 */
function applyTheme(theme: Theme) {
  const resolvedTheme = getResolvedTheme(theme);
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  updatePWATheme(resolvedTheme);
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => {
      return getSettings().match(
        (value) => {
          console.log("[SettingsProvider] settings", value);
          return value;
        },
        (error) => {
          console.log("[SettingsProvider] error", error);
          throw error;
        },
      );
    },
    initialData: getSettings().match(
      (value) => value,
      () => createDefaultSettings(),
    ),
    initialDataUpdatedAt: 0,
  });

  const settings = settingsQuery.data;
  const isLoading = settingsQuery.isLoading;
  const error = settingsQuery.error;
  const refresh = async () => {
    await settingsQuery.refetch();
    applyTheme(settings.theme);
    i18n.changeLanguage(settings.language.code);
    i18n.reloadResources(settings.language.code, "translation");
  };

  const queryClient = useQueryClient();

  const setMutation = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const res = updateSettings(updates);
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setCurrencyMutation = useMutation({
    mutationFn: async (currency: Currency) => {
      const res = updateCurrency(currency);
      if (res.isErr()) throw res.error;
      // Mark currency as consciously confirmed whenever user sets it
      const confirmRes = updateSettings({ isCurrencyConfirmed: true });
      if (confirmRes.isErr()) throw confirmRes.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setLanguageMutation = useMutation({
    mutationFn: async (language: Language) => {
      const res = updateLanguage(language);
      if (res.isErr()) throw res.error;
    },
    onMutate: async (newLanguage) => {
      // Store the previous language for rollback
      const previousLanguage = settings.language;

      // Optimistically update i18n and moment locale
      i18n.changeLanguage(newLanguage.code);
      setMomentLocale(newLanguage.code);

      // Return context for rollback
      return { previousLanguage };
    },
    onError: (_error, _newLanguage, context) => {
      // Rollback to previous language on error
      if (context?.previousLanguage) {
        i18n.changeLanguage(context.previousLanguage.code);
        setMomentLocale(context.previousLanguage.code);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      const res = updateTheme(theme);
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setSoundsMutation = useMutation({
    mutationFn: async (sounds: Settings["sounds"]) => {
      const res = updateSounds(sounds);
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setHapticsMutation = useMutation({
    mutationFn: async (haptics: Settings["haptics"]) => {
      const res = updateHaptics(haptics);
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const setDevModeMutation = useMutation({
    mutationFn: async (devMode: Settings["devMode"]) => {
      const res = updateDevMode(devMode);
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = resetSettings();
      if (res.isErr()) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  // Default currency and language from Netlify's edge geolocation on load. Only
  // runs until the user explicitly picks a currency (isCurrencyConfirmed) — after
  // that their choice always wins. Offline/dev (no /api/geo) keeps the local
  // timezone/locale default from createDefaultSettings.
  const currencyCode = settings.currency.currency;
  const languageCode = settings.language.code;
  const isCurrencyConfirmed = settings.isCurrencyConfirmed;
  useEffect(() => {
    if (isCurrencyConfirmed) return;
    let cancelled = false;
    (async () => {
      try {
        // Shared query key with useGeoLocale — one edge-function hit per load.
        const country = await queryClient.fetchQuery(geoCountryQuery);
        if (cancelled || !country) return;
        // Re-read instead of trusting the closure: the user may have confirmed
        // a currency on the login page while the edge call was in flight.
        const current = getSettings();
        if (current.isErr() || current.value.isCurrencyConfirmed) return;

        const detectedCurrency = currencyForCountry(country);
        const detectedLanguage = resolveLanguage(country);
        const updates: Partial<Settings> = {
          ...(detectedCurrency && detectedCurrency.currency !== currencyCode
            ? { currency: detectedCurrency }
            : {}),
          ...(detectedLanguage.code !== languageCode
            ? { language: detectedLanguage }
            : {}),
        };
        if (Object.keys(updates).length === 0) return;

        const result = updateSettings(updates);
        if (result.isErr()) return;
        if (updates.language) {
          i18n.changeLanguage(updates.language.code);
          setMomentLocale(updates.language.code);
        }
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      } catch {
        // network error — local detection default stands
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCurrencyConfirmed, currencyCode, languageCode, queryClient]);

  // Reapply system theme changes when theme === "system"
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (settings.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    applyTheme(settings.theme);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const contextValue: SettingsContextValue = {
    settings,
    isLoading,
    error,
    refresh,
    set: (u) => setMutation.mutateAsync(u),
    setCurrency: (c) => setCurrencyMutation.mutateAsync(c),
    setLanguage: (l) => setLanguageMutation.mutateAsync(l),
    setTheme: (t) => setThemeMutation.mutateAsync(t),
    setSounds: (s) => setSoundsMutation.mutateAsync(s),
    setHaptics: (h) => setHapticsMutation.mutateAsync(h),
    setDevMode: (d) => setDevModeMutation.mutateAsync(d),
    reset: () => resetMutation.mutateAsync(),
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
