import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listMembers } from "@/lib/members/service";
import { listServiceAttendance } from "@/lib/members/attendance";
import { saveAttendanceAction } from "@/lib/members/actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
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
      <PageHeader>
        <PageTitle>출석 관리</PageTitle>
      </PageHeader>

      <FilterBar>
        <Input
          name="date"
          type="date"
          defaultValue={serviceDate}
          className="w-auto"
        />
        <Select name="type" defaultValue={serviceType} className="w-auto">
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{SERVICE_TYPE_LABELS[s]}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          <Search />
          조회
        </Button>
      </FilterBar>

      <PageDescription className="mt-0">
        {serviceDate} · {SERVICE_TYPE_LABELS[serviceType]} · 출석 {presentCount}/
        {members.length}
      </PageDescription>

      {members.length === 0 ? (
        <EmptyState
          title="재적 교인이 없습니다"
          description="활동 상태의 교인을 등록하면 출석을 관리할 수 있습니다."
        />
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
                    <span className="text-muted-foreground"> · {m.position}</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <Button type="submit" className="w-fit">
            저장
          </Button>
        </form>
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
