import Link from "next/link";
import { headers } from "next/headers";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listMembers } from "@church/module-members/service";
import { qrDataUrl } from "@church/module-assets/qr";
import { TENANT_HOST_HEADER } from "@church/core/tenant/host";
import { PrintButton } from "@/app/(app)/assets/labels/print-button";

// 교인 QR 라벨(키오스크 체크인 딥링크). 스캔 → /members/kiosk/{memberId}.
export default async function MemberLabelsPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const members = await listMembers(user.church_id, { status: "active" });
  const h = await headers();
  const host = h.get(TENANT_HOST_HEADER) ?? h.get("host") ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";

  const labels = await Promise.all(
    members.map(async (m) => ({
      m,
      qr: await qrDataUrl(`${proto}://${host}/members/kiosk/${m.memberId}`),
    })),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">교인 QR (키오스크)</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/members" className="rounded-md border border-border px-3 py-1.5">← 목록</Link>
          <PrintButton />
        </div>
      </div>
      {labels.length === 0 ? (
        <p className="text-sm text-muted-foreground">교인이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {labels.map(({ m, qr }) => (
            <div key={m.memberId} className="flex flex-col items-center gap-1 rounded-md border border-border p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={m.name} width={120} height={120} />
              <div className="text-sm font-medium">{m.name}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
