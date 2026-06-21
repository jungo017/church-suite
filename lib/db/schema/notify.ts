import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * NOTIFICATION — 문자/알림톡 발송 로그 (스펙 §7.5).
 * ⚠️ 실제 SMS/알림톡 송출은 외부 채널 연동 추후(§14). 여기서는 큐/로그 + mock 발송.
 * channel: sms | alimtalk | email. status: queued | sent | failed.
 */
export const notification = pgTable(
  "notification",
  {
    notificationId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    recipient: text(), // 전화번호/이메일 스냅샷
    recipientName: text(),
    channel: text().notNull().default("sms"),
    message: text().notNull(),
    status: text().notNull().default("queued"),
    sentAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("notification_church_idx").on(t.churchId),
    index("notification_member_idx").on(t.memberId),
  ],
);
