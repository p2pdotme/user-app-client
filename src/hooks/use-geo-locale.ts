import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  currencyForCountry,
  detectCountryLocal,
  resolveLanguage,
} from "@/core/client/locale-detection";
import { geoCountryQuery } from "@/lib/geo";

/**
 * The user's market, resolved from Netlify edge geolocation. Until it answers
 * (or when it can't — dev, offline) the local timezone/locale guess keeps the
 * first paint right. `isResolved` flips once the edge answer is in, so callers
 * can tell a settled default from a provisional one.
 */
export function useGeoLocale() {
  const { data: geoCountry, isFetched } = useQuery(geoCountryQuery);
  const localCountry = useMemo(() => detectCountryLocal(), []);

  const country = geoCountry ?? localCountry;

  return useMemo(
    () => ({
      country,
      currency: country ? currencyForCountry(country) : undefined,
      language: resolveLanguage(country),
      isResolved: isFetched,
    }),
    [country, isFetched],
  );
}
