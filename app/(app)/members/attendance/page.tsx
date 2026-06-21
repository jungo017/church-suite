import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listMembers } from "@/lib/members/service";
import { listServiceAttendance } from "@/lib/members/attendance";
import { saveAttendanceAction } from "@/lib/members/actions";
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  isServiceType,
  type ServiceType,
} from "@/lib/members/constants";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; type?: string }>;
}) {
  const { date, type } = await searchParams;
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);

  const today = new Date().toISOString().slice(0, 10);
  const serviceDate = date ?? today;
  const serviceType: ServiceType =
    type && isServiceType(type) ? type : "sunday";

  const members = await listMembers(user.church_id, { status: "active" });
  const existing = await listServiceAttendance(
    user.church_id,
    serviceDate,
    serviceType,
  );
  const presentSet = new Set(
    existing.filter((e) => e.present).map((e) => e.memberId),
  );
  const presentCount = members.filter((m) =>
    presentSet.has(m.memberId),
  ).length;

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">출석 관리</h1>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input
          name="date"
          type="date"
          defaultValue={serviceDate}
          className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20 dark:bg-transparent"
        />
        <select
          name="type"
          defaultValue={serviceType}
          className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20 dark:bg-transparent"
        >
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</option>
          ))}
        </select>
        <button className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20">조회</button>
      </form>

      <p className="text-sm text-gray-500">
        {serviceDate} · {SERVICE_TYPE_LABELS[serviceType]} · 출석 {presentCount}/
        {members.length}
      </p>

      {members.length === 0 ? (
        <p className="text-sm text-gray-500">재적 교인이 없습니다.</p>
      ) : (
        <form
          action={saveAttendanceAction.bind(null, serviceDate, serviceType)}
          className="flex flex-col gap-2"
        >
          <ul className="flex flex-col gap-1">
            {members.map((m) => (
              <li key={m.memberId} className="flex items-center gap-2 text-sm">
                <input type="hidden" name="member" value={m.memberId} />
                <input
                  type="checkbox"
                  name="present"
                  value={m.memberId}
                  defaultChecked={presentSet.has(m.memberId)}
                  id={`a-${m.memberId}`}
                />
                <label htmlFor={`a-${m.memberId}`}>
                  {m.name}
                  {m.position ? (
                    <span className="text-gray-500"> · {m.position}</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <button className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            저장
          </button>
        </form>
      )}

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
