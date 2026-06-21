import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  listDepartments,
  listLocations,
  listCategories,
} from "@/lib/assets/classification";
import { createAssetAction } from "@/lib/assets/actions";
import { AssetForm } from "../asset-form";

export default async function NewAssetPage() {
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const [departments, locations, categories] = await Promise.all([
    listDepartments(user.church_id),
    listLocations(user.church_id),
    listCategories(user.church_id),
  ]);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">자산 등록</h1>
      <AssetForm
        action={createAssetAction}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        locations={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        submitLabel="등록"
      />
      <Link href="/assets" className="text-sm underline">
        ← 목록으로
      </Link>
    </section>
  );
}
