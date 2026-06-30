import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { appUser } from "./users";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * 소셜 로그인 신원/연동 (스펙 §14, 소셜로그인 → 교인 매핑).
 * 코어 소유(인증=코어). app_user.member_id 가 교인 매핑 seam.
 */

/**
 * USER_IDENTITY — 외부 공급자(kakao/naver 등) 신원 ↔ app_user 연결.
 * 한 사용자가 비번 + 여러 소셜 신원을 가질 수 있어 별도 테이블.
 * 같은 (church, provider, provider_user_id) 중복연결 차단(unique).
 * church 스코프(같은 카카오 계정이 교회마다 다른 사용자에 연결 가능) + RLS.
 */
export const userIdentity = pgTable(
  "user_identity",
  {
    identityId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => appUser.userId, { onDelete: "cascade" }),
    provider: text().notNull(), // "kakao" | "naver" | ...
    providerUserId: text().notNull(), // 공급자 sub
    email: text(),
    emailVerified: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("user_identity_provider_unique").on(
      t.churchId,
      t.provider,
      t.providerUserId,
    ),
    index("user_identity_church_idx").on(t.churchId),
    index("user_identity_user_idx").on(t.userId),
  ],
);

/**
 * MEMBER_CLAIM — 관리자 발급 "교인 연동 클레임"(A안, 결정적 매핑).
 * 관리자가 특정 member 에 대해 1회용 토큰을 발급 → 교인이 소셜 로그인하며 제시하면
 * 해당 member_id 로 계정이 바인딩된다. 원문은 저장 안 하고 sha256 해시만(refresh_token 패턴).
 */
export const memberClaim = pgTable(
  "member_claim",
  {
    claimId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    tokenHash: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    redeemedAt: timestamp({ withTimezone: true }),
    redeemedUserId: uuid().references(() => appUser.userId, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("member_claim_church_idx").on(t.churchId),
    index("member_claim_member_idx").on(t.memberId),
  ],
);
