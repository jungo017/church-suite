import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listFamilies } from "@/lib/members/service";
import { createFamilyAction } from "@/lib/members/actions";

export default async function FamiliesPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const families = await listFamilies(user.church_id);
  return (
    <section className="flex max-w-xl flex-col gap-5">
      <h1 className="text-2xl font-bold">가족 관리</h1>
      <form action={createFamilyAction} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="가족명 (예: 홍길동 가정)"
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
        <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">추가</button>
      </form>
      <ul className="flex flex-col gap-1 text-sm">
        {families.length === 0 && <li className="text-gray-500">등록된 가족이 없습니다.</li>}
        {families.map((f) => (
          <li key={f.familyId} className="border-b border-black/5 py-1.5 dark:border-white/10">{f.name}</li>
        ))}
      </ul>
      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
