import { afterEach, describe, expect, it } from "vitest";
import { createDefaultSettings, getSettings } from "@/core/client/settings";
import { CURRENCY_META_DATA, STORAGE_KEYS } from "@/lib/constants";

const BOB_CLIENTS = "https://t.me/p2pmebolivia";
const BOB_MERCHANTS = "https://t.me/p2pme_bolivia_merchants";

describe("market Telegram support channel", () => {
  afterEach(() => localStorage.clear());

  it("sends Bolivian customers to the clients group", () => {
    expect(CURRENCY_META_DATA.BOB.telegramSupportChannel).toBe(BOB_CLIENTS);
  });

  it("points no market at a merchants group", () => {
    for (const option of Object.values(CURRENCY_META_DATA)) {
      expect(option.telegramSupportChannel).not.toMatch(/merchant/i);
    }
  });

  // A Bolivian user who picked BOB before the fix has the merchants URL saved
  // in localStorage. Loading settings must replace it, not keep serving it.
  it("heals a saved BOB setting that still holds the merchants group", () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        ...createDefaultSettings(),
        currency: {
          ...CURRENCY_META_DATA.BOB,
          telegramSupportChannel: BOB_MERCHANTS,
        },
        isCurrencyConfirmed: true,
      }),
    );

    const settings = getSettings()._unsafeUnwrap();
    expect(settings.currency.currency).toBe("BOB");
    expect(settings.isCurrencyConfirmed).toBe(true);
    expect(settings.currency.telegramSupportChannel).toBe(BOB_CLIENTS);
  });
});
