import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listMembersPaged } from "@/lib/members/service";
import { pageParams } from "@/lib/db/pagination";
import { Pagination } from "../pagination";
import {
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  GENDER_LABELS,
  type MemberStatus,
  type Gender,
} from "@/lib/members/constants";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; size?: string }>;
}) {
  const { status, q, page: pageParam, size } = await searchParams;
  const user = await requireUser();
  const { page, pageSize } = pageParams({ page: pageParam, size });
  const result = await listMembersPaged(user.church_id, { status, q }, page, pageSize);
  const members = result.items;
  const canWrite = hasPermission(user.roles, PERMISSIONS.MEMBERS_WRITE);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">교적 ({result.total})</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/members/stats" className="rounded-md border border-border px-3 py-1.5">통계</Link>
          {hasPermission(user.roles, PERMISSIONS.CHURCH_MANAGE) && (
            <Link href="/members/compliance" className="rounded-md border border-border px-3 py-1.5">컴플라이언스</Link>
          )}
          {canWrite && (
            <>
              <Link href="/members/attendance" className="rounded-md border border-border px-3 py-1.5">출석</Link>
              <Link href="/members/kiosk" className="rounded-md border border-border px-3 py-1.5">키오스크</Link>
              <Link href="/members/labels" className="rounded-md border border-border px-3 py-1.5">QR</Link>
              <Link href="/members/education" className="rounded-md border border-border px-3 py-1.5">교육</Link>
              <Link href="/members/notify" className="rounded-md border border-border px-3 py-1.5">알림</Link>
              <Link href="/members/families" className="rounded-md border border-border px-3 py-1.5">가족 관리</Link>
              <Link href="/members/new" className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background">+ 교인 등록</Link>
            </>
          )}
        </div>
      </div>

      <form className="flex flex-wrap gap-2 text-sm">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름 검색"
          className="rounded-md border border-border px-3 py-1.5 dark:bg-transparent"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-border px-3 py-1.5 dark:bg-transparent"
        >
          <option value="">전체 상태</option>
          {MEMBER_STATUSES.map((s) => (
            <option key={s} value={s}>{MEMBER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="rounded-md border border-border px-3 py-1.5">검색</button>
      </form>

      {members.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">교인이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2">이름</th>
              <th className="py-2">성별</th>
              <th className="py-2">직분</th>
              <th className="py-2">상태</th>
              <th className="py-2">연락처</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.memberId} className="border-b border-border hover:bg-muted">
                <td className="py-2">
                  <Link href={`/members/${m.memberId}`} className="font-medium underline">{m.name}</Link>
                </td>
                <td className="py-2">{m.gender ? GENDER_LABELS[m.gender as Gender] : "—"}</td>
                <td className="py-2">{m.position ?? "—"}</td>
                <td className="py-2">{MEMBER_STATUS_LABELS[m.status as MemberStatus] ?? m.status}</td>
                <td className="py-2">{m.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        basePath="/members"
        page={result.page}
        totalPages={result.totalPages}
        params={{ q, status }}
      />
    </section>
  );
}
