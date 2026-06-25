import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getSite, listBoards, listPages } from "@/lib/site/admin";
import {
  setSiteStatusAction,
  setSiteThemeAction,
  createBoardAction,
  createPageAction,
} from "@/lib/site/actions";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Field, FieldLabel, Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";

const THEME_LABELS: Record<string, string> = {
  modern: "모던",
  warm: "따뜻함",
  minimal: "미니멀",
  dark: "다크",
};

export default async function SiteAdminPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");

  const [site, boards, pages] = await Promise.all([
    getSite(user.church_id),
    listBoards(user.church_id),
    listPages(user.church_id),
  ]);
  const published = site?.status === "published";

  return (
    <section className="flex max-w-2xl flex-col gap-8">
      <PageHeader>
        <PageTitle>홈페이지 관리</PageTitle>
        <PageActions>
          <Button asChild variant="outline">
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              공개 사이트 미리보기
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-6">
        <form action={setSiteThemeAction} className="flex items-end gap-2">
          <Field>
            <FieldLabel htmlFor="theme">테마</FieldLabel>
            <Select
              id="theme"
              name="theme"
              defaultValue={site?.theme ?? "modern"}
              className="w-28"
            >
              {Object.entries(THEME_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="outline">적용</Button>
        </form>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">상태</span>
          <Badge tone={published ? "success" : "muted"}>
            {published ? "공개" : "비공개"}
          </Badge>
          <form action={setSiteStatusAction}>
            <input
              type="hidden"
              name="status"
              value={published ? "draft" : "published"}
            />
            <Button type="submit" variant="outline" size="sm">
              {published ? "비공개로 전환" : "공개로 전환"}
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">게시판</h2>
        <form action={createBoardAction} className="flex flex-wrap items-end gap-2">
          <Input name="slug" placeholder="slug (예: notice)" className="w-40" required />
          <Input name="name" placeholder="이름 (예: 공지사항)" className="flex-1" required />
          <Button type="submit">추가</Button>
        </form>
        {boards.length === 0 ? (
          <EmptyState
            title="게시판이 없습니다"
            description="위 입력란에서 첫 게시판을 추가하세요."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {boards.map((b) => (
              <li key={b.boardId} className="flex justify-between border-b border-border py-1.5">
                <Link href={`/site/boards/${b.boardId}`} className="underline">{b.name}</Link>
                <span className="text-muted-foreground">/{b.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">페이지</h2>
        <form action={createPageAction} className="flex flex-wrap items-end gap-2">
          <Input name="slug" placeholder="slug (예: about)" className="w-40" required />
          <Input name="title" placeholder="제목 (예: 교회소개)" className="flex-1" required />
          <Button type="submit">추가</Button>
        </form>
        {pages.length === 0 ? (
          <EmptyState
            title="페이지가 없습니다"
            description="위 입력란에서 첫 페이지를 추가하세요."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {pages.map((p) => (
              <li key={p.pageId} className="flex items-center justify-between gap-2 border-b border-border py-1.5">
                <Link href={`/site/pages/${p.pageId}`} className="underline">{p.title}</Link>
                <span className="flex items-center gap-2 text-muted-foreground">
                  /{p.slug}
                  <Badge tone={p.published ? "success" : "muted"}>
                    {p.published ? "공개" : "비공개"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
