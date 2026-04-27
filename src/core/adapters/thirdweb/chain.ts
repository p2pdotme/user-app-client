import { defineChain } from "thirdweb";
import {
  baseSepolia as baseSepoliaThirdweb,
  base as baseThirdweb,
  hardhat,
  polygonAmoy as polygonAmoyThirdweb,
  type Chain as ThirdwebChain,
} from "thirdweb/chains";
import type {
  UseConnectModalOptions,
  UseWalletDetailsModalOptions,
} from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import {
  baseSepolia as baseSepoliaViem,
  base as baseViem,
  hardhat as hardhatViem,
  polygonAmoy as polygonAmoyViem,
  type Chain as ViemChain,
} from "viem/chains";
import type { Currency } from "@/core/client/settings";
import { COUNTRY_OPTIONS, URLS } from "@/lib/constants";

const getChain = (): { thirdweb: ThirdwebChain; viem: ViemChain } => {
  const chainId = import.meta.env.VITE_CHAIN;

  switch (chainId) {
    case "baseSepolia":
      return { thirdweb: baseSepoliaThirdweb, viem: baseSepoliaViem };
    case "base":
      return { thirdweb: baseThirdweb, viem: baseViem };
    case "polygonAmoy":
      return { thirdweb: polygonAmoyThirdweb, viem: polygonAmoyViem };
    case "hardhat":
      return {
        thirdweb: { ...hardhat, rpc: "http://localhost:8545/", id: 1337 },
        viem: hardhatViem,
      };
    default:
      throw new Error(
        `Unsupported chain ID: ${chainId} please check your .env file`,
      );
  }
};
const { thirdweb: thirdwebChain, viem: viemChain } = getChain();

export const chain = defineChain({
  id: thirdwebChain.id,
  rpc: import.meta.env.VITE_HTTP_RPC_URL,
  nativeCurrency: thirdwebChain.nativeCurrency,
  testnet: thirdwebChain.testnet,
  blockExplorers: thirdwebChain.blockExplorers,
});

export { viemChain };

// Extract SMS country code type from thirdweb
type SmsCountryCode = NonNullable<
  NonNullable<
    NonNullable<Parameters<typeof inAppWallet>[0]>["auth"]
  >["allowedSmsCountryCodes"]
>[number];

// Derive allowed SMS country codes from currency config
const ALLOWED_SMS_COUNTRY_CODES = [
  ...new Set(COUNTRY_OPTIONS.flatMap((c) => c.smsCountryCodes ?? [])),
] as SmsCountryCode[];

/**
 * Creates thirdweb wallet config with dynamic SMS country code based on currency
 * Uses Thirdweb's default paymaster for gas sponsorship
 */
export function createConnectWalletConfig(
  currencySymbol?: Currency["currency"],
): Omit<UseConnectModalOptions, "client"> {
  const smsCountryCodes = COUNTRY_OPTIONS.find(
    (c) => c.currency === currencySymbol,
  )?.smsCountryCodes;
  const defaultSmsCountryCode = smsCountryCodes?.[0] as
    | SmsCountryCode
    | undefined;
  return {
    chain,
    size: "compact",
    wallets: [
      inAppWallet({
        executionMode: {
          mode: "EIP4337",
          smartAccount: {
            sponsorGas: true,
            chain,
            factoryAddress: import.meta.env
              .VITE_THIRDWEB_CONTRACT_ADDRESS_AA_FACTORY,
          },
        },
        auth: {
          mode: "redirect",
          options: [
            "google",
            "email",
            "phone",
            "passkey",
            ...(["development", "local"].includes(
              import.meta.env.VITE_ENVIRONMENT,
            )
              ? (["guest"] as const)
              : []),
          ],
          allowedSmsCountryCodes: ALLOWED_SMS_COUNTRY_CODES,
          ...(defaultSmsCountryCode && { defaultSmsCountryCode }),
        },
      }),
    ],
    showAllWallets: false,
    titleIcon: "https://p2p.me/favicon.svg",
    welcomeScreen: {
      title: "P2P.me - Pay with USDC at any QR",
      subtitle: "Pay with USDC at any QR",
      img: {
        src: "https://p2p.me/favicon.svg",
        width: 150,
        height: 150,
      },
    },
    showThirdwebBranding: false,
    termsOfServiceUrl: URLS.TERMS_AND_CONDITIONS,
    privacyPolicyUrl: URLS.TERMS_AND_CONDITIONS,
  };
}

export const walletDetailsModalConfig: Omit<
  UseWalletDetailsModalOptions,
  "client"
> = {
  displayBalanceToken: {
    [thirdwebChain.id]: import.meta.env.VITE_CONTRACT_ADDRESS_USDC,
  },
  supportedTokens: {
    [thirdwebChain.id]: [
      {
        address: import.meta.env.VITE_CONTRACT_ADDRESS_USDC,
        name: "USDC",
        symbol: "USDC",
        icon: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
      },
    ],
  },
  payOptions: {
    buyWithCrypto: false,
    buyWithFiat: {
      preferredProvider: "coinbase",
      prefillSource: {
        currency: "USD",
      },
    },
    prefillBuy: {
      chain: thirdwebChain,
      token: {
        address: import.meta.env.VITE_CONTRACT_ADDRESS_USDC,
        name: "USDC",
        symbol: "USDC",
        icon: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
      },
      allowEdits: {
        amount: true,
        token: false,
        chain: false,
      },
    },
  },
};
