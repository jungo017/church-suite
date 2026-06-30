const DEFAULT_RESERVED_LOGIN_IDS = [
  "admin",
  "sadmin",
  "administrator",
  "root",
  "system",
  "support",
  "owner",
  "superadmin",
];

function extraReservedLoginIds(): string[] {
  return (process.env.RESERVED_LOGIN_IDS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeLoginId(loginId: string): string {
  return loginId.trim();
}

export function reservedLoginIds(): Set<string> {
  return new Set([...DEFAULT_RESERVED_LOGIN_IDS, ...extraReservedLoginIds()]);
}

export function isReservedLoginId(loginId: string): boolean {
  return reservedLoginIds().has(normalizeLoginId(loginId).toLowerCase());
}

export function assertUsableLoginId(loginId: string): string {
  const normalized = normalizeLoginId(loginId);
  if (!normalized) throw new Error("invalid_login_id");
  if (isReservedLoginId(normalized)) throw new Error("reserved_login_id");
  return normalized;
}
