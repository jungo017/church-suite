import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listDepartments } from "@/lib/assets/classification";
import { listFamilies } from "@/lib/members/service";
import { createMemberAction } from "@/lib/members/actions";
import { MemberForm } from "../member-form";

export default async function NewMemberPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const [departments, families] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
  ]);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">교인 등록</h1>
      <MemberForm
        action={createMemberAction}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        families={families.map((f) => ({ id: f.familyId, name: f.name }))}
        submitLabel="등록"
      />
      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
