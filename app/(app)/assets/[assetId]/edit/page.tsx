import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { getAsset } from "@church/module-assets/service";
import { listDepartments } from "@church/core/department";
import {
  listLocations,
  listCategories,
} from "@church/module-assets/classification";
import { updateAssetAction } from "@church/module-assets/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
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
      <PageHeader>
        <PageTitle>자산 편집</PageTitle>
      </PageHeader>
      <AssetForm
        action={updateAssetAction.bind(null, assetId)}
        asset={a}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        locations={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        submitLabel="저장"
      />
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={`/assets/${assetId}`}>
          <ArrowLeft />
          상세로
        </Link>
      </Button>
    </section>
  );
}
