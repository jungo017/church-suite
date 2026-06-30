import { timestamp } from "drizzle-orm/pg-core";

/**
 * 모든 테이블 공통 타임스탬프 컬럼.
 * 각 테이블에서 `...timestamps` 로 스프레드해 사용합니다.
 */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
