import { describe, it, expect, afterAll } from "vitest";
import {
  ensureSite,
  getSite,
  createBoard,
  listBoards,
  createPost,
  listPosts,
  setPostPublished,
  createPage,
  updatePage,
  getPageById,
} from "@/lib/site/admin";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("CMS 어드민", () => {
  it("site/board/post/page 관리 + 발행 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await ensureSite(a);
    await ensureSite(a); // idempotent
    expect((await getSite(a))?.churchId).toBe(a);

    const { boardId } = await createBoard(a, { slug: "notice", name: "공지사항" });
    expect((await listBoards(a)).length).toBe(1);

    const { postId } = await createPost(a, { boardId, title: "환영합니다", body: "내용", published: true });
    let posts = await listPosts(a, boardId);
    expect(posts).toHaveLength(1);
    expect(posts[0]!.published).toBe(true);

    await setPostPublished(a, postId, false);
    posts = await listPosts(a, boardId);
    expect(posts[0]!.published).toBe(false);

    const { pageId } = await createPage(a, { slug: "about", title: "교회소개" });
    await updatePage(a, pageId, { body: "소개 내용", published: true });
    const pg = await getPageById(a, pageId);
    expect(pg?.published).toBe(true);
    expect(pg?.body).toBe("소개 내용");

    // 격리
    expect(await getSite(b)).toBeNull();
    expect((await listBoards(b)).length).toBe(0);
  });
});
