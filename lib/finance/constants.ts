// 재정 도메인 상수 (순수).

export const ACCOUNT_TYPES = ["income", "expense"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  income: "수입",
  expense: "지출",
};
export function isAccountType(v: string): v is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(v);
}

export const PAYMENT_METHODS = ["cash", "transfer", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "현금",
  transfer: "계좌이체",
  card: "카드",
  other: "기타",
};
export function isPaymentMethod(v: string): v is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(v);
}

/** 금액 포맷(원). */
export function formatWon(amount: string | number | null | undefined): string {
  if (amount == null || amount === "") return "—";
  return `${Number(amount).toLocaleString()}원`;
}
