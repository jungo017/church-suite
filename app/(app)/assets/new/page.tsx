import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  listDepartments,
  listLocations,
  listCategories,
} from "@/lib/assets/classification";
import { createAssetAction } from "@/lib/assets/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
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
      <PageHeader>
        <PageTitle>자산 등록</PageTitle>
      </PageHeader>
      <AssetForm
        action={createAssetAction}
        departments={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        locations={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        submitLabel="등록"
      />
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/assets">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
