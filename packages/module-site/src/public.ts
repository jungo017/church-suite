import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { site, board, post, page } from "@church/core/db/schema";
import { getTenant } from "@church/core/tenant/context";

/**
 * 공개 컨텍스트(호스트→교회→발행 사이트 + 네비 데이터). 없으면 null.
 * 공개 라우트에서 공통으로 사용.
 */
export async function getPublicContext() {
  const tenant = await getTenant();
  if (!tenant) return null;
  const published = await getPublicSite(tenant.churchId);
  if (!published) return null;
  const [pages, boards] = await Promise.all([
    listPublicPages(tenant.churchId),
    listPublicBoards(tenant.churchId),
  ]);
  return { tenant, site: published, pages, boards };
}

/**
 * 공개 영역 읽기 서비스 (스펙 §2.4, §17).
 * ⚠️ 발행(published)된 CMS 콘텐츠만 반환한다. 민감 테이블은 절대 다루지 않는다.
 * churchId 는 호스트(서브도메인) 해석으로 얻는다(인증 불필요).
 */

/** 발행된 사이트만 반환(status=published). 아니면 null. */
export async function getPublicSite(churchId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(site)
      .where(and(eq(site.churchId, churchId), eq(site.status, "published")))
      .limit(1),
  );
  return rows[0] ?? null;
}

/** 공개 사이트 색상 테마(발행 여부와 무관). 없으면 modern. */
export async function getPublicSiteTheme(churchId: string): Promise<string> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ theme: site.theme })
      .from(site)
      .where(eq(site.churchId, churchId))
      .limit(1),
  );
  return rows[0]?.theme ?? "modern";
}

export async function listPublicBoards(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx.select().from(board).where(eq(board.churchId, churchId)),
  );
}

export async function getPublicBoardBySlug(churchId: string, slug: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(board)
      .where(and(eq(board.churchId, churchId), eq(board.slug, slug)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function listPublicPosts(churchId: string, boardId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(post)
      .where(
        and(
          eq(post.churchId, churchId),
          eq(post.boardId, boardId),
          eq(post.published, true),
        ),
      )
      .orderBy(desc(post.publishedAt)),
  );
}

export async function getPublicPost(churchId: string, postId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(post)
      .where(
        and(
          eq(post.churchId, churchId),
          eq(post.postId, postId),
          eq(post.published, true),
        ),
      )
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function listRecentPublicPosts(churchId: string, limit = 5) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        postId: post.postId,
        title: post.title,
        publishedAt: post.publishedAt,
        boardSlug: board.slug,
        boardName: board.name,
      })
      .from(post)
      .innerJoin(board, eq(post.boardId, board.boardId))
      .where(and(eq(post.churchId, churchId), eq(post.published, true)))
      .orderBy(desc(post.publishedAt))
      .limit(limit),
  );
}

export async function listPublicPages(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(page)
      .where(and(eq(page.churchId, churchId), eq(page.published, true))),
  );
}

export async function getPublicPageBySlug(churchId: string, slug: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(page)
      .where(
        and(
          eq(page.churchId, churchId),
          eq(page.slug, slug),
          eq(page.published, true),
        ),
      )
      .limit(1),
  );
  return rows[0] ?? null;
}
