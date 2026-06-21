import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getSite, listBoards, listPages } from "@/lib/site/admin";
import {
  setSiteStatusAction,
  setSiteThemeAction,
  createBoardAction,
  createPageAction,
} from "@/lib/site/actions";
import { controlClass } from "@/lib/ui/form";

const THEME_LABELS: Record<string, string> = {
  modern: "모던",
  warm: "따뜻함",
  minimal: "미니멀",
  dark: "다크",
};
const btnPrimary =
  "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90";
const btnOutline =
  "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted";

export default async function SiteAdminPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");

  const [site, boards, pages] = await Promise.all([
    getSite(user.church_id),
    listBoards(user.church_id),
    listPages(user.church_id),
  ]);

  return (
    <section className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/site/new-family" className={btnOutline}>새가족 신청</Link>
        <Link href="/site/offerings" className={btnOutline}>온라인 헌금</Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">홈페이지 관리</h1>
        <div className="flex flex-wrap items-center gap-4">
          <form action={setSiteThemeAction} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">테마</span>
            <select
              name="theme"
              defaultValue={site?.theme ?? "modern"}
              className={controlClass + " w-28"}
            >
              {Object.entries(THEME_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button className={btnOutline}>적용</button>
          </form>
          <form action={setSiteStatusAction} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              상태: {site?.status === "published" ? "공개" : "비공개"}
            </span>
            <input
              type="hidden"
              name="status"
              value={site?.status === "published" ? "draft" : "published"}
            />
            <button className={btnOutline}>
              {site?.status === "published" ? "비공개로 전환" : "공개로 전환"}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">게시판</h2>
        <form action={createBoardAction} className="flex flex-wrap gap-2">
          <input name="slug" placeholder="slug (예: notice)" className={controlClass + " w-40"} required />
          <input name="name" placeholder="이름 (예: 공지사항)" className={controlClass + " flex-1"} required />
          <button className={btnPrimary}>추가</button>
        </form>
        <ul className="flex flex-col gap-1 text-sm">
          {boards.length === 0 && <li className="text-muted-foreground">게시판이 없습니다.</li>}
          {boards.map((b) => (
            <li key={b.boardId} className="flex justify-between border-b border-border py-1.5">
              <Link href={`/site/boards/${b.boardId}`} className="underline">{b.name}</Link>
              <span className="text-muted-foreground">/{b.slug}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">페이지</h2>
        <form action={createPageAction} className="flex flex-wrap gap-2">
          <input name="slug" placeholder="slug (예: about)" className={controlClass + " w-40"} required />
          <input name="title" placeholder="제목 (예: 교회소개)" className={controlClass + " flex-1"} required />
          <button className={btnPrimary}>추가</button>
        </form>
        <ul className="flex flex-col gap-1 text-sm">
          {pages.length === 0 && <li className="text-muted-foreground">페이지가 없습니다.</li>}
          {pages.map((p) => (
            <li key={p.pageId} className="flex justify-between border-b border-border py-1.5">
              <Link href={`/site/pages/${p.pageId}`} className="underline">{p.title}</Link>
              <span className="text-muted-foreground">/{p.slug} · {p.published ? "공개" : "비공개"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
