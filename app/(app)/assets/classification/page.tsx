import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  listDepartments,
  listLocations,
  listCategories,
} from "@/lib/assets/classification";
import {
  createDepartmentAction,
  createLocationAction,
  createCategoryAction,
} from "@/lib/assets/actions";
import { departmentTreeRows } from "@/lib/org/tree";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Input, Select } from "@/lib/ui/form";

function Manager({
  title,
  action,
  items,
  parentOptions,
}: {
  title: string;
  action: (fd: FormData) => Promise<void>;
  items: { id: string; name: string }[];
  parentOptions?: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {items.length === 0 && <li className="text-muted-foreground">없음</li>}
        {items.map((i) => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
      <form action={action} className="flex gap-2">
        {parentOptions && (
          <Select
            name="parentId"
            className="min-w-0"
            defaultValue=""
            aria-label="상위 조직"
          >
            <option value="">상위 없음</option>
            {parentOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        )}
        <Input name="name" required placeholder="새 항목" />
        <Button type="submit">추가</Button>
      </form>
    </div>
  );
}

export default async function ClassificationPage() {
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const [departments, locations, categories] = await Promise.all([
    listDepartments(user.church_id),
    listLocations(user.church_id),
    listCategories(user.church_id),
  ]);
  const departmentRows = departmentTreeRows(departments);

  return (
    <section className="flex flex-col gap-8">
      <PageHeader>
        <div>
          <PageTitle>자산 분류 관리</PageTitle>
          <PageDescription>
            품목·부서·장소를 관리해 자산을 분류합니다.
          </PageDescription>
        </div>
      </PageHeader>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Manager
          title="품목"
          action={createCategoryAction}
          items={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        />
        <Manager
          title="부서/구역/속"
          action={createDepartmentAction}
          items={departmentRows.map((d) => ({
            id: d.departmentId,
            name: d.label,
          }))}
          parentOptions={departmentRows.map((d) => ({
            id: d.departmentId,
            name: d.label,
          }))}
        />
        <Manager
          title="장소"
          action={createLocationAction}
          items={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        />
      </div>
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/assets">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
