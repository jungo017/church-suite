import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * 재정 모듈 (스펙 §7.3). 단식부기 모델. 금액은 numeric(부동소수점 금지, §4).
 * 복잡 집계는 raw SQL 로 처리(§4).
 */

/** ACCOUNT — 계정과목. type: income | expense. 교회범위 code 유니크. */
export const account = pgTable(
  "account",
  {
    accountId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    code: text().notNull(),
    name: text().notNull(),
    type: text().notNull().default("income"),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("account_church_idx").on(t.churchId),
    uniqueIndex("account_church_code_unique").on(t.churchId, t.code),
  ],
);

/**
 * VOUCHER — 전표(단식). type: income(수입/헌금) | expense(지출).
 * memberId: 헌금자(수입 시, 기부금영수증 연동). method: cash | transfer | card.
 */
export const voucher = pgTable(
  "voucher",
  {
    voucherId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    voucherDate: date().notNull(),
    type: text().notNull(),
    accountId: uuid()
      .notNull()
      .references(() => account.accountId, { onDelete: "restrict" }),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    method: text(),
    summary: text(),
    note: text(),
    ...timestamps,
  },
  (t) => [
    index("voucher_church_idx").on(t.churchId),
    index("voucher_date_idx").on(t.voucherDate),
    index("voucher_account_idx").on(t.accountId),
    index("voucher_member_idx").on(t.memberId),
  ],
);
