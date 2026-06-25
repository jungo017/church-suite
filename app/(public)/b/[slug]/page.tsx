import { notFound } from "next/navigation";
import {
  getPublicContext,
  getPublicBoardBySlug,
  listPublicPosts,
} from "@/lib/site/public";
import { PublicHeader } from "@/lib/ui/public-site/public-header";
import {
  PublicShell,
  PublicContainer,
  PublicFooter,
} from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";
import { PublicPostList } from "@/lib/ui/public-site/public-post-list";

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPublicContext();
  if (!ctx) notFound();

  const board = await getPublicBoardBySlug(ctx.tenant.churchId, slug);
  if (!board) notFound();
  const posts = await listPublicPosts(ctx.tenant.churchId, board.boardId);
  const churchName = ctx.site.title || ctx.tenant.name;

  return (
    <PublicShell>
      <PublicHeader
        churchName={churchName}
        pages={ctx.pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={ctx.boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <PublicContainer>
        <PublicPageTitle>{board.name}</PublicPageTitle>
        <div className="mt-6">
          <PublicPostList
            items={posts.map((p) => ({
              href: `/b/${slug}/${p.postId}`,
              title: p.title,
              meta: p.publishedAt
                ? new Date(p.publishedAt).toISOString().slice(0, 10)
                : undefined,
            }))}
          />
        </div>
      </PublicContainer>
      <PublicFooter name={churchName} />
    </PublicShell>
  );
}
