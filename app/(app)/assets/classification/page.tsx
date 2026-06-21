import Link from "next/link";
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

function Manager({
  title,
  action,
  items,
}: {
  title: string;
  action: (fd: FormData) => Promise<void>;
  items: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {items.length === 0 && <li className="text-gray-500">없음</li>}
        {items.map((i) => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
      <form action={action} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="새 항목"
          className="rounded-md border border-black/15 px-2 py-1 text-sm dark:border-white/20 dark:bg-transparent"
        />
        <button className="rounded-md bg-foreground px-3 py-1 text-sm text-background">
          추가
        </button>
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

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">자산 분류 관리</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Manager
          title="품목"
          action={createCategoryAction}
          items={categories.map((c) => ({ id: c.categoryId, name: c.name }))}
        />
        <Manager
          title="부서"
          action={createDepartmentAction}
          items={departments.map((d) => ({ id: d.departmentId, name: d.name }))}
        />
        <Manager
          title="장소"
          action={createLocationAction}
          items={locations.map((l) => ({ id: l.locationId, name: l.name }))}
        />
      </div>
      <Link href="/assets" className="text-sm underline">
        ← 목록으로
      </Link>
    </section>
  );
}
