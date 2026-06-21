import {
  pgTable,
  uuid,
  text,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * 접수(intake) 테이블 (스펙 §2.4, §6.2, §7.4).
 * 공개 영역에서 외부 입력을 안전하게 받는다. 검토/연동 후 마스터·재정에 반영.
 * 모두 church_id + RLS.
 */

/** NEWFAMILY_REQ — 새가족 등록 신청. status: pending | approved | rejected */
export const newfamilyReq = pgTable(
  "newfamily_req",
  {
    reqId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    name: text().notNull(),
    phone: text(),
    email: text(),
    address: text(),
    message: text(),
    status: text().notNull().default("pending"),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("newfamily_req_church_idx").on(t.churchId)],
);

/** ONLINE_OFFERING — 온라인 헌금 접수. status: pending | paid | reflected */
export const onlineOffering = pgTable(
  "online_offering",
  {
    offeringId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    donorName: text(),
    donorPhone: text(),
    offeringKind: text(), // 헌금 종류(십일조 등)
    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    method: text(),
    pgRef: text(),
    status: text().notNull().default("pending"),
    voucherId: uuid(), // 재정 반영 시 연결된 전표
    ...timestamps,
  },
  (t) => [index("online_offering_church_idx").on(t.churchId)],
);
