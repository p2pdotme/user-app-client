// Exposes Netlify's edge geolocation to the SPA. Fetched on first load to default
// the fiat currency and language to the user's market — see SettingsProvider and
// the login page (`useGeoLocale`).
export default (
  _request: Request,
  context: { geo?: { country?: { code?: string } } },
) => Response.json({ country: context.geo?.country?.code ?? null });

export const config = { path: "/api/geo" };
