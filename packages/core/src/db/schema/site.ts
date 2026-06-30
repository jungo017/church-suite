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
import { timestamps } from "./_shared";

/**
 * 홈페이지/CMS (스펙 §6.2, §7.4). 발행(published) 콘텐츠만 공개 영역에서 노출.
 * 모든 테이블 church_id + RLS.
 */

/** SITE — 1교회 1홈페이지. status: draft | published */
export const site = pgTable(
  "site",
  {
    siteId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    title: text().notNull().default("교회 홈페이지"),
    theme: text().notNull().default("default"),
    status: text().notNull().default("draft"),
    ...timestamps,
  },
  (t) => [uniqueIndex("site_church_unique").on(t.churchId)],
);

/** BOARD — 게시판(공지/설교/주보/갤러리…). slug 교회범위 유니크. */
export const board = pgTable(
  "board",
  {
    boardId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    slug: text().notNull(),
    name: text().notNull(),
    type: text().notNull().default("general"),
    ...timestamps,
  },
  (t) => [
    index("board_church_idx").on(t.churchId),
    uniqueIndex("board_church_slug_unique").on(t.churchId, t.slug),
  ],
);

/** POST — 게시글. published=true 만 공개. */
export const post = pgTable(
  "post",
  {
    postId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    boardId: uuid()
      .notNull()
      .references(() => board.boardId, { onDelete: "cascade" }),
    title: text().notNull(),
    body: text().notNull().default(""),
    published: boolean().notNull().default(false),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("post_church_idx").on(t.churchId),
    index("post_board_idx").on(t.boardId),
    index("post_published_idx").on(t.published),
  ],
);

/** PAGE — 정적 페이지(소개 등). slug 교회범위 유니크. published=true 만 공개. */
export const page = pgTable(
  "page",
  {
    pageId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    slug: text().notNull(),
    title: text().notNull(),
    body: text().notNull().default(""),
    published: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("page_church_idx").on(t.churchId),
    uniqueIndex("page_church_slug_unique").on(t.churchId, t.slug),
  ],
);
