import { notFound } from "next/navigation";
import { getPublicContext, getPublicPageBySlug } from "@church/module-site/public";
import { PublicHeader } from "@/lib/ui/public-site/public-header";
import {
  PublicShell,
  PublicContainer,
  PublicFooter,
} from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";

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
          <PublicPageTitle>{pageRow.title}</PublicPageTitle>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{pageRow.body}</div>
        </article>
      </PublicContainer>
      <PublicFooter name={churchName} />
    </PublicShell>
  );
}
