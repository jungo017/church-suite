import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getMember, listFamilies } from "@/lib/members/service";
import { listDepartments } from "@/lib/assets/classification";
import { deleteMemberAction } from "@/lib/members/actions";
import {
  GENDER_LABELS,
  MEMBER_STATUS_LABELS,
  type Gender,
  type MemberStatus,
} from "@/lib/members/constants";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-black/5 py-2 dark:border-white/10">
      <span className="w-24 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const user = await requireUser();
  const m = await getMember(user.church_id, memberId);
  if (!m) notFound();
  const canWrite = hasPermission(user.roles, PERMISSIONS.MEMBERS_WRITE);

  const [departments, families] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
  ]);
  const deptName = departments.find((d) => d.departmentId === m.departmentId)?.name;
  const familyName = families.find((f) => f.familyId === m.familyId)?.name;

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.name}</h1>
        {canWrite && (
          <div className="flex gap-2">
            <Link href={`/members/${m.memberId}/edit`} className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20">편집</Link>
            <form action={deleteMemberAction.bind(null, m.memberId)}>
              <button className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600">삭제</button>
            </form>
          </div>
        )}
      </div>
      <div>
        <Row label="상태" value={MEMBER_STATUS_LABELS[m.status as MemberStatus] ?? m.status} />
        <Row label="성별" value={m.gender ? GENDER_LABELS[m.gender as Gender] : null} />
        <Row label="생년월일" value={m.birth} />
        <Row label="직분" value={m.position} />
        <Row label="구역/부서" value={deptName} />
        <Row label="가족" value={familyName} />
        <Row label="연락처" value={m.phone} />
        <Row label="이메일" value={m.email} />
        <Row label="주소" value={m.address} />
        <Row label="등록일" value={m.registeredDate} />
      </div>
      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
