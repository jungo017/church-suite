import Link from "next/link";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { listAssets } from "@/lib/assets/service";
import { qrDataUrl, assetUrl } from "@/lib/assets/qr";
import { TENANT_HOST_HEADER } from "@/lib/tenant/host";
import { PrintButton } from "./print-button";

// QR 라벨 인쇄 페이지 (스펙 §7.1). 스캔 시 자산 상세로 이동.
export default async function LabelsPage() {
  const user = await requireUser();
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
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">QR 라벨</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/assets"
            className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20"
          >
            ← 목록
          </Link>
          <PrintButton />
        </div>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-gray-500">자산이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {labels.map(({ a, qr }) => (
            <div
              key={a.assetId}
              className="flex flex-col items-center gap-1 rounded-md border border-black/15 p-3 text-center dark:border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={a.name} width={120} height={120} />
              <div className="text-sm font-medium">{a.name}</div>
              {a.tag && <div className="text-xs text-gray-500">{a.tag}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
