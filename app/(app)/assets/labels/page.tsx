import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listAssets } from "@/lib/assets/service";
import { qrDataUrl, assetUrl } from "@/lib/assets/qr";
import { TENANT_HOST_HEADER } from "@/lib/tenant/host";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import { PrintButton } from "./print-button";

// QR 라벨 인쇄 페이지 (스펙 §7.1). 스캔 시 자산 상세로 이동.
export default async function LabelsPage() {
  const user = await requirePermission(PERMISSIONS.ASSETS_READ);
  const assets = await listAssets(user.church_id);
  const h = await headers();
  const host = h.get(TENANT_HOST_HEADER) ?? h.get("host") ?? "localhost";

  const labels = await Promise.all(
    assets.map(async (a) => ({
      a,
      qr: await qrDataUrl(assetUrl(host, a.assetId)),
    })),
  );

  return (
    <section className="flex flex-col gap-4">
      <PageHeader className="print:hidden">
        <PageTitle>QR 라벨</PageTitle>
        <PageActions>
          <Button asChild variant="outline">
            <Link href="/assets">
              <ArrowLeft />
              목록
            </Link>
          </Button>
          <PrintButton />
        </PageActions>
      </PageHeader>

      {assets.length === 0 ? (
        <EmptyState
          title="자산이 없습니다"
          description="자산을 등록하면 QR 라벨을 출력할 수 있습니다."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {labels.map(({ a, qr }) => (
            <div
              key={a.assetId}
              className="flex flex-col items-center gap-1 rounded-md border border-border p-3 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={a.name} width={120} height={120} />
              <div className="text-sm font-medium">{a.name}</div>
              {a.tag && <div className="text-xs text-muted-foreground">{a.tag}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
