import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listFamilies } from "@/lib/members/service";
import { createFamilyAction } from "@/lib/members/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Input } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";

export default async function FamiliesPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const families = await listFamilies(user.church_id);
  return (
    <section className="flex max-w-xl flex-col gap-5">
      <PageHeader>
        <PageTitle>가족 관리</PageTitle>
      </PageHeader>
      <form action={createFamilyAction} className="flex gap-2">
        <Input
          name="name"
          required
          placeholder="가족명 (예: 홍길동 가정)"
          className="flex-1"
        />
        <Button type="submit">추가</Button>
      </form>
      {families.length === 0 ? (
        <EmptyState
          title="등록된 가족이 없습니다"
          description="가족을 추가하면 교인을 가정 단위로 묶어 관리할 수 있습니다."
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {families.map((f) => (
            <li key={f.familyId} className="border-b border-border py-1.5">{f.name}</li>
          ))}
        </ul>
      )}
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
