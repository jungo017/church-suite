import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listDepartments } from "@church/core/department";
import { getMember, listFamilies } from "@/lib/members/service";
import { listPositions } from "@/lib/members/org";
import { updateMemberAction } from "@/lib/members/actions";
import { MemberForm } from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const m = await getMember(user.church_id, memberId);
  if (!m) notFound();
  const [departments, families, positions] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
    listPositions(user.church_id),
  ]);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">교인 편집</h1>
      <MemberForm
        action={updateMemberAction.bind(null, memberId)}
        member={m}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        families={families.map((f) => ({ id: f.familyId, name: f.name }))}
        positions={positions.map((p) => ({ id: p.positionId, name: p.label }))}
        submitLabel="저장"
      />
      <Link href={`/members/${memberId}`} className="text-sm underline">← 상세로</Link>
    </section>
  );
}
