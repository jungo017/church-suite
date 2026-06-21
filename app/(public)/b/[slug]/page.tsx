import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicContext,
  getPublicBoardBySlug,
  listPublicPosts,
} from "@/lib/site/public";
import { SiteHeader } from "../../site-header";

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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        churchName={ctx.site.title || ctx.tenant.name}
        pages={ctx.pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={ctx.boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="mb-4 text-2xl font-bold">{board.name}</h1>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">게시된 글이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {posts.map((p) => (
              <li key={p.postId} className="flex justify-between border-b border-border py-2">
                <Link href={`/b/${slug}/${p.postId}`} className="underline">{p.title}</Link>
                <span className="text-muted-foreground">
                  {p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
