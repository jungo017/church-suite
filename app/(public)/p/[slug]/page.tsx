import { notFound } from "next/navigation";
import { getPublicContext, getPublicPageBySlug } from "@church/module-site/public";
import { SiteHeader } from "../../site-header";

export default async function PublicPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPublicContext();
  if (!ctx) notFound();

  const pageRow = await getPublicPageBySlug(ctx.tenant.churchId, slug);
  if (!pageRow) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        churchName={ctx.site.title || ctx.tenant.name}
        pages={ctx.pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={ctx.boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <article className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{pageRow.title}</h1>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{pageRow.body}</div>
        </article>
      </main>
    </div>
  );
}
