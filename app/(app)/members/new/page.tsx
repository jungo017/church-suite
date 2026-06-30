import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listDepartments } from "@church/core/department";
import { listFamilies } from "@church/module-members/service";
import { listPositions } from "@church/module-members/org";
import { createMemberAction } from "@church/module-members/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { MemberForm } from "../member-form";

export default async function NewMemberPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const [departments, families, positions] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
    listPositions(user.church_id),
  ]);
  return (
    <section className="flex flex-col gap-6">
      <PageHeader>
        <PageTitle>교인 등록</PageTitle>
      </PageHeader>
      <MemberForm
        action={createMemberAction}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        families={families.map((f) => ({ id: f.familyId, name: f.name }))}
        positions={positions.map((p) => ({ id: p.positionId, name: p.label }))}
        submitLabel="등록"
      />
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
