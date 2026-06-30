import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { withSystem } from "@church/core/db/tenant";
import { refreshToken } from "@church/core/db/schema";
import { REFRESH_TTL_SEC } from "./config";

/**
 * 리프레시 토큰 DB 연산 (스펙 §9). 원문은 저장하지 않고 sha256 해시만 저장.
 * 리프레시 시점엔 church_id 를 모르므로 해시 조회는 withSystem(RLS 우회)으로 한다
 * (토큰 자체가 추측 불가한 비밀이므로 안전).
 */
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueRefreshToken(opts: {
  churchId: string;
  userId: string;
  userAgent?: string | null;
}): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  await withSystem((tx) =>
    tx.insert(refreshToken).values({
      churchId: opts.churchId,
      userId: opts.userId,
      tokenHash,
      expiresAt,
      userAgent: opts.userAgent ?? null,
    }),
  );
  return raw;
}

export type RefreshRecord = {
  tokenId: string;
  churchId: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export async function findRefreshToken(
  raw: string,
): Promise<RefreshRecord | null> {
  const tokenHash = hashToken(raw);
  const rows = await withSystem((tx) =>
    tx
      .select({
        tokenId: refreshToken.tokenId,
        churchId: refreshToken.churchId,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
        revokedAt: refreshToken.revokedAt,
      })
      .from(refreshToken)
      .where(eq(refreshToken.tokenHash, tokenHash))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await withSystem((tx) =>
    tx
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(eq(refreshToken.tokenId, tokenId)),
  );
}

/** 사용자의 모든 활성 리프레시 토큰 취소(강제 로그아웃·재사용 탐지 시). */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await withSystem((tx) =>
    tx
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshToken.userId, userId), isNull(refreshToken.revokedAt)),
      ),
  );
}
