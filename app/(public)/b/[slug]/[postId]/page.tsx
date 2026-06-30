import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicContext, getPublicPost } from "@church/module-site/public";
import { PublicHeader } from "@/lib/ui/public-site/public-header";
import {
  PublicShell,
  PublicContainer,
  PublicFooter,
} from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";

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

  const churchName = ctx.site.title || ctx.tenant.name;

  return (
    <PublicShell>
      <PublicHeader
        churchName={churchName}
        pages={ctx.pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={ctx.boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <PublicContainer>
        <article className="flex flex-col gap-4">
          <PublicPageTitle>{post.title}</PublicPageTitle>
          <p className="text-xs text-muted-foreground">
            {post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : ""}
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
        </article>
        <Link href={`/b/${slug}`} className="mt-8 inline-block text-sm underline">← 목록</Link>
      </PublicContainer>
      <PublicFooter name={churchName} />
    </PublicShell>
  );
}
