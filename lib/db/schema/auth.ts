import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { church } from "./church";
import { appUser } from "./users";
import { timestamps } from "./_shared";

/**
 * REFRESH_TOKEN — 취소 가능한 리프레시 토큰 (스펙 §9).
 *
 * 토큰 원문은 저장하지 않고 sha256 해시만 저장한다(token_hash, unique).
 * 리프레시/로그아웃 시 해시로 조회해 검증·회전·취소한다.
 * 리프레시 시점엔 church_id 를 모르므로 조회는 withSystem(RLS 우회)로 하고,
 * 사용자별 토큰 관리(목록/일괄 취소)는 withTenant 로 한다.
 */
export const refreshToken = pgTable(
  "refresh_token",
  {
    tokenId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => appUser.userId, { onDelete: "cascade" }),
    tokenHash: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    userAgent: text(),
    ...timestamps,
  },
  (t) => [
    index("refresh_token_church_idx").on(t.churchId),
    index("refresh_token_user_idx").on(t.userId),
  ],
);
