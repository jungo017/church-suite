import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getAsset } from "@/lib/assets/service";
import {
  listDepartments,
  listLocations,
  listCategories,
} from "@/lib/assets/classification";
import { updateAssetAction } from "@/lib/assets/actions";
import { AssetForm } from "../../asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const a = await getAsset(user.church_id, assetId);
  if (!a) notFound();

  const [departments, locations, categories] = await Promise.all([
    listDepartments(user.church_id),
    listLocations(user.church_id),
    listCategories(user.church_id),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">자산 편집</h1>
      <AssetForm
        action={updateAssetAction.bind(null, assetId)}
        asset={a}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        locations={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        submitLabel="저장"
      />
      <Link href={`/assets/${assetId}`} className="text-sm underline">
        ← 상세로
      </Link>
    </section>
  );
}
