import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listMembers } from "@/lib/members/service";
import { qrDataUrl } from "@/lib/assets/qr";
import { TENANT_HOST_HEADER } from "@/lib/tenant/host";
import { PrintButton } from "@/app/(app)/assets/labels/print-button";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";

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
      <PageHeader className="print:hidden">
        <PageTitle>교인 QR (키오스크)</PageTitle>
        <PageActions>
          <Button asChild variant="outline">
            <Link href="/members">
              <ArrowLeft />
              목록
            </Link>
          </Button>
          <PrintButton />
        </PageActions>
      </PageHeader>
      {labels.length === 0 ? (
        <EmptyState
          title="교인이 없습니다"
          description="활성 교인이 있으면 키오스크 체크인용 QR 라벨이 표시됩니다."
        />
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
