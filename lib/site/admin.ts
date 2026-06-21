import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { site, board, post, page } from "@/lib/db/schema";

/** CMS 어드민 서비스 (스펙 §7.4, 내부). 테넌트 스코프. */

// ── SITE ──
export async function getSite(churchId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx.select().from(site).where(eq(site.churchId, churchId)).limit(1),
  );
  return rows[0] ?? null;
}

export async function ensureSite(churchId: string) {
  await withTenant(churchId, (tx) =>
    tx.insert(site).values({ churchId }).onConflictDoNothing(),
  );
  return getSite(churchId);
}

export async function setSiteStatus(churchId: string, status: string) {
  await withTenant(churchId, (tx) =>
    tx.update(site).set({ status }).where(eq(site.churchId, churchId)),
  );
}

// ── BOARD ──
export async function listBoards(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx.select().from(board).where(eq(board.churchId, churchId)).orderBy(asc(board.name)),
  );
}

export async function getBoard(churchId: string, boardId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(board)
      .where(and(eq(board.churchId, churchId), eq(board.boardId, boardId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createBoard(
  churchId: string,
  input: { slug: string; name: string; type?: string },
): Promise<{ boardId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(board)
      .values({
        churchId,
        slug: input.slug,
        name: input.name,
        type: input.type ?? "general",
      })
      .returning({ boardId: board.boardId });
    return { boardId: rows[0]!.boardId };
  });
}

// ── POST ──
export async function listPosts(churchId: string, boardId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(post)
      .where(and(eq(post.churchId, churchId), eq(post.boardId, boardId)))
      .orderBy(desc(post.createdAt)),
  );
}

export async function createPost(
  churchId: string,
  input: { boardId: string; title: string; body?: string; published?: boolean },
): Promise<{ postId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(post)
      .values({
        churchId,
        boardId: input.boardId,
        title: input.title,
        body: input.body ?? "",
        published: input.published ?? false,
        publishedAt: input.published ? new Date() : null,
      })
      .returning({ postId: post.postId });
    return { postId: rows[0]!.postId };
  });
}

export async function setPostPublished(
  churchId: string,
  postId: string,
  published: boolean,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(post)
      .set({ published, publishedAt: published ? new Date() : null })
      .where(and(eq(post.churchId, churchId), eq(post.postId, postId))),
  );
}

export async function deletePost(churchId: string, postId: string): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx.delete(post).where(and(eq(post.churchId, churchId), eq(post.postId, postId))),
  );
}

// ── PAGE ──
export async function listPages(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx.select().from(page).where(eq(page.churchId, churchId)).orderBy(asc(page.slug)),
  );
}

export async function getPageById(churchId: string, pageId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(page)
      .where(and(eq(page.churchId, churchId), eq(page.pageId, pageId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createPage(
  churchId: string,
  input: { slug: string; title: string; body?: string },
): Promise<{ pageId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(page)
      .values({
        churchId,
        slug: input.slug,
        title: input.title,
        body: input.body ?? "",
      })
      .returning({ pageId: page.pageId });
    return { pageId: rows[0]!.pageId };
  });
}

export async function updatePage(
  churchId: string,
  pageId: string,
  input: { title?: string; body?: string; published?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.body !== undefined) set.body = input.body;
  if (input.published !== undefined) set.published = input.published;
  if (Object.keys(set).length === 0) return;
  await withTenant(churchId, (tx) =>
    tx.update(page).set(set).where(and(eq(page.churchId, churchId), eq(page.pageId, pageId))),
  );
}
