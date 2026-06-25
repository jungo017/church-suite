import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getPageById } from "@/lib/site/admin";
import { updatePageAction } from "@/lib/site/actions";
import { PageHeader, PageTitle, PageDescription, PageActions } from "@/lib/ui/page";
import { Field, FieldLabel, Input, Textarea } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");

  const pageRow = await getPageById(user.church_id, pageId);
  if (!pageRow) notFound();

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <div>
          <PageTitle>페이지 편집</PageTitle>
          <PageDescription>/{pageRow.slug}</PageDescription>
        </div>
        <PageActions>
          <Button asChild variant="outline">
            <Link href={`/p/${pageRow.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              공개 사이트 미리보기
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <form action={updatePageAction.bind(null, pageId)} className="flex flex-col gap-3">
        <Field>
          <FieldLabel htmlFor="title">제목</FieldLabel>
          <Input id="title" name="title" defaultValue={pageRow.title} />
        </Field>
        <Field>
          <FieldLabel htmlFor="body">내용</FieldLabel>
          <Textarea id="body" name="body" rows={12} defaultValue={pageRow.body} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={pageRow.published} /> 공개
        </label>
        <Button type="submit" className="w-fit">저장</Button>
      </form>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/site">
          <ArrowLeft />
          홈페이지 관리
        </Link>
      </Button>
    </section>
  );
}
