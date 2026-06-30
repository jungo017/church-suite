import Link from "next/link";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@church/core/member";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import { DescriptionList, DescriptionItem } from "@/lib/ui/description-list";

// 교인 셀프 포털 홈 (온라인교인센터). 로그인한 교인의 본인 정보.
export default async function MyHomePage() {
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);

  if (!me) {
    return (
      <section className="flex flex-col gap-5">
        <PageHeader>
          <PageTitle>내 정보</PageTitle>
        </PageHeader>
        <EmptyState
          title="연결된 교인 정보가 없습니다"
          description="교회 관리자에게 문의하세요."
        />
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <PageHeader>
        <PageTitle>{me.name} 님</PageTitle>
      </PageHeader>

      <DescriptionList>
        <DescriptionItem label="직분">{me.position ?? "—"}</DescriptionItem>
        <DescriptionItem label="연락처">{me.phone ?? "—"}</DescriptionItem>
        <DescriptionItem label="등록일">{me.registeredDate ?? "—"}</DescriptionItem>
      </DescriptionList>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/my/forms">설문 · 보고</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/my/giving">나의 헌금내역</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">교회 홈페이지</Link>
        </Button>
      </div>
    </section>
  );
}
