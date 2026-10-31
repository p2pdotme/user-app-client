import { beforeEach, vi } from "vitest";

type AccountLike = {
  address: string;
  signMessage: (args: { message: string }) => Promise<string>;
};

// Module level so a test can change the answer between two renders of the
// same component. The values survive vi.clearAllMocks, because they are plain
// variables and not vi.fn state, so they get their own reset below.
let activeAccount: AccountLike | undefined;
let activeChain: { id: number } | undefined = { id: 8453 };

export function mockActiveAccount(account: AccountLike | undefined) {
  activeAccount = account;
}

export function mockActiveWalletChain(chain: { id: number } | undefined) {
  activeChain = chain;
}

// Vitest gives each test file its own module registry, so these values are
// already isolated across files. Within one file they are not, so reset them
// per test. Without this, a test that ends with no wallet leaves the next
// test in the same file with no wallet and no sign of why.
beforeEach(() => {
  activeAccount = undefined;
  activeChain = { id: 8453 };
});

// This file is a setup file, see vitest.config.mts. That is deliberate: a
// vi.mock only reaches modules imported after it runs, and a setup file always
// runs before the test file's own imports. It has to be always on anyway,
// because the mock and the setters that drive it live in the same module.
vi.mock("thirdweb/react", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useActiveAccount: () => activeAccount,
  useActiveWalletChain: () => activeChain,
}));
