import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { getMember } from "@church/module-members/service";
import { listServiceAttendance } from "@church/module-members/attendance";
import { kioskSetAction } from "@church/module-members/actions";

// QR 스캔 체크인 대상: 교인 QR → 이 페이지 → 확인 버튼으로 출석 처리.
export default async function KioskCheckinPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const m = await getMember(user.church_id, memberId);
  if (!m) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const existing = await listServiceAttendance(user.church_id, today, "sunday");
  const isPresent = existing.some((e) => e.memberId === memberId && e.present);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-bold">{m.name}</h1>
      <p className="text-sm text-muted-foreground">{today} 주일예배</p>
      {isPresent ? (
        <p className="text-2xl font-semibold text-green-600">✓ 출석 확인됨</p>
      ) : (
        <form action={kioskSetAction.bind(null, memberId, true)}>
          <button className="rounded-lg bg-foreground px-8 py-4 text-lg font-medium text-background">
            출석 체크
          </button>
        </form>
      )}
      <Link href="/members/kiosk" className="text-sm underline">키오스크로</Link>
    </main>
  );
}
