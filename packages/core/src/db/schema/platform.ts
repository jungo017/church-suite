import { pgTable, uuid, text, uniqueIndex, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

/**
 * PLATFORM_USER — 전체 시스템 관리자/유지보수 사용자.
 *
 * 교회 테넌트에 속하지 않으므로 church_id 를 갖지 않는다. 교회별 app_user 와
 * 분리해 특정 교회 관리자가 전체 시스템 권한을 얻는 일을 방지한다.
 */
export const platformUser = pgTable(
  "platform_user",
  {
    platformUserId: uuid().primaryKey().defaultRandom(),
    loginId: text().notNull(),
    passwordHash: text().notNull(),
    name: text().notNull(),
    role: text().notNull(),
    status: text().notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("platform_user_login_unique").on(t.loginId),
    index("platform_user_role_idx").on(t.role),
  ],
);
