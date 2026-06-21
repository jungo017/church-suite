import Link from "next/link";
import { getTenant } from "@/lib/tenant/context";
import {
  getPublicSite,
  listPublicPages,
  listPublicBoards,
  listRecentPublicPosts,
} from "@/lib/site/public";
import { SiteHeader } from "./site-header";

const btnPrimary =
  "inline-block w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90";
const btnOutline =
  "rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-muted";

// 공개 홈 ("/").
// - 루트 도메인: SaaS 마케팅/가입 랜딩
// - 교회 서브도메인 + 사이트 발행: 교회 공개 홈페이지(발행 콘텐츠만)
// - 교회 서브도메인 + 미발행: 준비중 안내
export default async function HomePage() {
  const tenant = await getTenant();

  // ── 루트 도메인: 마케팅 랜딩 ──
  if (!tenant) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">교회 관리 SaaS</h1>
        <p className="text-base text-muted-foreground">
          멀티테넌트 교회 관리 플랫폼 — 비품 · 교적 · 재정 · 홈페이지.
        </p>
        <div className="mt-2 flex gap-3">
          <a href="/onboard" className={btnPrimary}>
            교회 만들기 →
          </a>
          <span className="self-center text-sm text-muted-foreground">
            이미 교회가 있나요? 교회 주소(<code>코드.도메인</code>)에서 로그인하세요.
          </span>
        </div>
      </main>
    );
  }

  const site = await getPublicSite(tenant.churchId);

  // ── 사이트 미발행 ──
  if (!site) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted-foreground">홈페이지 준비 중입니다.</p>
        <a href="/online/new-family" className="text-sm underline">새가족 등록</a>
      </main>
    );
  }

  const [pages, boards, recent] = await Promise.all([
    listPublicPages(tenant.churchId),
    listPublicBoards(tenant.churchId),
    listRecentPublicPosts(tenant.churchId, 6),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        churchName={site.title || tenant.name}
        pages={pages.map((p) => ({ slug: p.slug, title: p.title }))}
        boards={boards.map((b) => ({ slug: b.slug, name: b.name }))}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold">{tenant.name}</h1>

        <div className="mt-6 flex gap-3 text-sm">
          <a href="/online/new-family" className={btnOutline}>새가족 등록</a>
          <a href="/online/offering" className={btnOutline}>온라인 헌금</a>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">최근 소식</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">게시된 글이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recent.map((r) => (
                <li key={r.postId} className="flex justify-between border-b border-border py-2">
                  <Link href={`/b/${r.boardSlug}/${r.postId}`} className="underline">{r.title}</Link>
                  <span className="text-muted-foreground">{r.boardName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
