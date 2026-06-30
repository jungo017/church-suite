import Link from "next/link";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@church/core/member";

// 교인 셀프 포털 홈 (온라인교인센터). 로그인한 교인의 본인 정보.
export default async function MyHomePage() {
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">내 정보</h1>
        <p className="text-sm text-muted-foreground">
          연결된 교인 정보가 없습니다. 교회 관리자에게 문의하세요.
        </p>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <h1 className="text-2xl font-bold">{me.name} 님</h1>
      <div className="text-sm">
        <div className="flex gap-4 border-b border-border py-2">
          <span className="w-24 text-muted-foreground">직분</span>
          <span>{me.position ?? "—"}</span>
        </div>
        <div className="flex gap-4 border-b border-border py-2">
          <span className="w-24 text-muted-foreground">연락처</span>
          <span>{me.phone ?? "—"}</span>
        </div>
        <div className="flex gap-4 border-b border-border py-2">
          <span className="w-24 text-muted-foreground">등록일</span>
          <span>{me.registeredDate ?? "—"}</span>
        </div>
      </div>
      <div className="flex gap-3 text-sm">
        <Link href="/my/forms" className="rounded-md border border-border px-3 py-1.5">
          설문 · 보고
        </Link>
        <Link href="/my/giving" className="rounded-md border border-border px-3 py-1.5">
          나의 헌금내역
        </Link>
        <Link href="/" className="rounded-md border border-border px-3 py-1.5">
          교회 홈페이지
        </Link>
      </div>
    </section>
  );
}
