import { describe, it, expect, afterAll } from "vitest";
import {
  ensureSite,
  setSiteStatus,
  createBoard,
  createPost,
  createPage,
  updatePage,
} from "@church/module-site/admin";
import {
  getPublicSite,
  listPublicPosts,
  getPublicPost,
  getPublicPageBySlug,
} from "@church/module-site/public";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("공개 영역 경계 (발행 콘텐츠만)", () => {
  it("미발행 사이트/글/페이지는 공개되지 않는다 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await ensureSite(a);
    // draft 사이트는 공개 안 됨
    expect(await getPublicSite(a)).toBeNull();
    await setSiteStatus(a, "published");
    expect(await getPublicSite(a)).not.toBeNull();

    const { boardId } = await createBoard(a, { slug: "notice", name: "공지" });
    const pub = await createPost(a, { boardId, title: "공개글", published: true });
    const draft = await createPost(a, { boardId, title: "비공개글", published: false });

    const posts = await listPublicPosts(a, boardId);
    expect(posts).toHaveLength(1);
    expect(posts[0]!.title).toBe("공개글");

    expect(await getPublicPost(a, pub.postId)).not.toBeNull();
    expect(await getPublicPost(a, draft.postId)).toBeNull(); // 미발행 숨김

    const { pageId } = await createPage(a, { slug: "about", title: "소개" });
    expect(await getPublicPageBySlug(a, "about")).toBeNull(); // 미발행
    await updatePage(a, pageId, { published: true });
    expect(await getPublicPageBySlug(a, "about")).not.toBeNull();

    // 격리: b 는 발행 사이트 없음
    expect(await getPublicSite(b)).toBeNull();
  });
});
