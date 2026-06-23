import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getMember, listFamilies } from "@/lib/members/service";
import { listMemberCare } from "@/lib/members/care";
import { listMemberAttendance } from "@/lib/members/attendance";
import { listDepartments } from "@/lib/assets/classification";
import { positionLabelMap } from "@/lib/members/org";
import { logAccess } from "@/lib/compliance/access-log";
import {
  deleteMemberAction,
  addCareAction,
  deleteCareAction,
  createMemberUserAction,
} from "@/lib/members/actions";
import {
  GENDER_LABELS,
  MEMBER_STATUS_LABELS,
  CARE_TYPES,
  CARE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type Gender,
  type MemberStatus,
  type CareType,
  type ServiceType,
} from "@/lib/members/constants";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-2">
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
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
  if (!hasPermission(user.roles, PERMISSIONS.MEMBERS_READ)) redirect("/forbidden");
  const m = await getMember(user.church_id, memberId);
  if (!m) notFound();
  // 민감정보(교인 상세) 접근 기록 (PIPA §5)
  await logAccess(user.church_id, {
    userId: user.sub,
    action: "member.view",
    targetType: "member",
    targetId: m.memberId,
  });
  const canWrite = hasPermission(user.roles, PERMISSIONS.MEMBERS_WRITE);

  const [departments, families, posMap] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
    positionLabelMap(user.church_id),
  ]);
  const positionLabel = m.positionId ? (posMap[m.positionId] ?? null) : m.position;
  const deptName = departments.find((d) => d.departmentId === m.departmentId)?.name;
  const familyName = families.find((f) => f.familyId === m.familyId)?.name;
  const [care, recentAttendance] = await Promise.all([
    listMemberCare(user.church_id, m.memberId),
    listMemberAttendance(user.church_id, m.memberId, 8),
  ]);
  const careInput =
    "rounded-md border border-border px-2 py-1 text-sm dark:bg-transparent";

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.name}</h1>
        {canWrite && (
          <div className="flex gap-2">
            <Link href={`/members/${m.memberId}/edit`} className="rounded-md border border-border px-3 py-1.5 text-sm">편집</Link>
            <form action={deleteMemberAction.bind(null, m.memberId)}>
              <button className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-destructive">삭제</button>
            </form>
          </div>
        )}
      </div>
      <div>
        <Row label="상태" value={MEMBER_STATUS_LABELS[m.status as MemberStatus] ?? m.status} />
        <Row label="성별" value={m.gender ? GENDER_LABELS[m.gender as Gender] : null} />
        <Row label="생년월일" value={m.birth} />
        <Row label="직분" value={positionLabel} />
        <Row label="구역/부서" value={deptName} />
        <Row label="가족" value={familyName} />
        <Row label="연락처" value={m.phone} />
        <Row label="이메일" value={m.email} />
        <Row label="주소" value={m.address} />
        <Row label="등록일" value={m.registeredDate} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">목양 기록</h2>
        {care.length === 0 ? (
          <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {care.map((c) => (
              <li
                key={c.careId}
                className="flex items-start justify-between gap-4 border-b border-border pb-2 text-sm"
              >
                <div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {CARE_TYPE_LABELS[c.careType as CareType] ?? c.careType}
                  </span>{" "}
                  <span className="text-muted-foreground">{c.careDate ?? ""}</span>
                  <div>{c.content}</div>
                </div>
                {canWrite && (
                  <form action={deleteCareAction.bind(null, m.memberId, c.careId)}>
                    <button className="text-xs text-destructive">삭제</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {canWrite && (
          <form action={addCareAction.bind(null, m.memberId)} className="flex flex-wrap items-end gap-2">
            <select name="careType" className={careInput} defaultValue="visitation">
              {CARE_TYPES.map((t) => (
                <option key={t} value={t}>{CARE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input name="careDate" type="date" className={careInput} />
            <input name="content" required placeholder="내용" className={`${careInput} flex-1`} />
            <button className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background">기록 추가</button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">최근 출석</h2>
        {recentAttendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">출석 기록이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {recentAttendance.map((r) => (
              <li key={r.attendanceId} className="text-muted-foreground">
                {r.serviceDate} · {SERVICE_TYPE_LABELS[r.serviceType as ServiceType] ?? r.serviceType} ·{" "}
                {r.present ? "출석" : "결석"}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canWrite && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">교인 셀프포털 계정</h2>
          <p className="text-xs text-muted-foreground">
            교인이 직접 로그인해 본인 정보·헌금내역을 볼 수 있는 계정을 발급합니다.
          </p>
          <form action={createMemberUserAction.bind(null, m.memberId)} className="flex flex-wrap items-end gap-2">
            <input name="loginId" required placeholder="로그인 아이디" className={careInput} />
            <input name="password" type="password" required placeholder="비밀번호(8자+)" className={careInput} />
            <button className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background">계정 발급</button>
          </form>
        </section>
      )}

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
