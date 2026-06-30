import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getPageById } from "@/lib/site/admin";
import { updatePageAction } from "@/lib/site/actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

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
      <h1 className="text-2xl font-bold">페이지 편집 · /{pageRow.slug}</h1>

      <form action={updatePageAction.bind(null, pageId)} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          제목
          <input name="title" defaultValue={pageRow.title} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          내용
          <textarea name="body" rows={12} defaultValue={pageRow.body} className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={pageRow.published} /> 공개
        </label>
        <button className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">저장</button>
      </form>

      <Link href="/site" className="text-sm underline">← 홈페이지 관리</Link>
    </section>
  );
}
