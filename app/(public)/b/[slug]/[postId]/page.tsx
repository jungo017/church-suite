import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicContext, getPublicPost } from "@church/module-site/public";
import { SiteHeader } from "../../../site-header";

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const ctx = await getPublicContext();
  if (!ctx) notFound();

  const post = await getPublicPost(ctx.tenant.churchId, postId);
  if (!post) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        churchName={ctx.site.title || ctx.tenant.name}
        pages={ctx.pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={ctx.boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <article className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="text-xs text-muted-foreground">
            {post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : ""}
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
        </article>
        <Link href={`/b/${slug}`} className="mt-8 inline-block text-sm underline">← 목록</Link>
      </main>
    </div>
  );
}
