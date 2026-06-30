import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listMembers } from "@church/module-members/service";
import { listServiceAttendance } from "@church/module-members/attendance";
import { kioskSetAction } from "@church/module-members/actions";

// 탭 키오스크 — 교인을 탭하면 오늘 주일예배 출석 토글.
export default async function KioskPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const today = new Date().toISOString().slice(0, 10);
  const members = await listMembers(user.church_id, { status: "active" });
  const existing = await listServiceAttendance(user.church_id, today, "sunday");
  const present = new Set(existing.filter((e) => e.present).map((e) => e.memberId));
  const count = members.filter((m) => present.has(m.memberId)).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">출석 키오스크</h1>
        <div className="text-sm text-muted-foreground">
          {today} 주일예배 · 출석 {count}/{members.length}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">이름을 눌러 출석을 체크하세요.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {members.map((m) => {
          const isPresent = present.has(m.memberId);
          return (
            <form key={m.memberId} action={kioskSetAction.bind(null, m.memberId, !isPresent)}>
              <button
                className={`w-full rounded-lg border p-4 text-center text-lg font-medium ${
                  isPresent
                    ? "border-success/40 bg-success/10 text-success dark:bg-success/10"
                    : "border-border"
                }`}
              >
                {isPresent ? "✓ " : ""}
                {m.name}
              </button>
            </form>
          );
        })}
      </div>
      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
