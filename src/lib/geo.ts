/**
 * The one shared geo query — SettingsProvider (queryClient.fetchQuery) and
 * `useGeoLocale` (useQuery) both resolve through this key, so a cold load hits
 * the Netlify edge function once, not once per consumer.
 *
 * Resolves to null when the edge function isn't available (local dev, offline,
 * non-Netlify preview) so consumers fall back to local timezone/locale detection.
 */
export const GEO_ENDPOINT = "/api/geo";

export const geoCountryQuery = {
  queryKey: ["geo-country"] as const,
  queryFn: async (): Promise<string | null> => {
    const res = await fetch(GEO_ENDPOINT);
    if (!res.ok) throw new Error(`geo ${res.status}`);
    // The SPA fallback serves index.html for unknown paths in dev — don't try
    // to parse that as JSON.
    if (!res.headers.get("content-type")?.includes("application/json")) {
      return null;
    }
    const { country } = (await res.json()) as { country?: string | null };
    return typeof country === "string" ? country : null;
  },
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
};
