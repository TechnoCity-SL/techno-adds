// Real company bank account details aren't set up yet — these env vars are
// unset in dev/testing and fall back to obvious placeholders rather than
// fabricated-but-plausible-looking numbers, so nobody mistakes a placeholder
// for a real account to transfer money into. Must be set to the real
// business bank account before this payment method goes live.
export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export function getBankTransferDetails(): BankTransferDetails {
  return {
    bankName:
      process.env.BANK_TRANSFER_BANK_NAME ??
      "PLACEHOLDER BANK — set BANK_TRANSFER_BANK_NAME",
    accountName:
      process.env.BANK_TRANSFER_ACCOUNT_NAME ??
      "PLACEHOLDER — set BANK_TRANSFER_ACCOUNT_NAME",
    accountNumber: process.env.BANK_TRANSFER_ACCOUNT_NUMBER ?? "0000000000",
    branch:
      process.env.BANK_TRANSFER_BRANCH ??
      "PLACEHOLDER — set BANK_TRANSFER_BRANCH",
  };
}
