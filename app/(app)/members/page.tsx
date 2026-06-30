import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { requirePermission } from "@church/core/rbac/guards";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { listMembersPaged } from "@church/module-members/service";
import { positionLabelMap } from "@church/module-members/org";
import { pageParams } from "@church/core/db/pagination";
import { Pagination } from "../pagination";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  MEMBER_STATUSES,
  MEMBER_STATUS_LABELS,
  GENDER_LABELS,
  type MemberStatus,
  type Gender,
} from "@church/module-members/constants";

// 교인 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  inactive: "muted",
  transferred: "info",
  deceased: "muted",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; size?: string }>;
}) {
  const { status, q, page: pageParam, size } = await searchParams;
  const user = await requirePermission(PERMISSIONS.MEMBERS_READ);
  const canWrite = hasPermission(user.roles, PERMISSIONS.MEMBERS_WRITE);
  const { page, pageSize } = pageParams({ page: pageParam, size });
  const result = await listMembersPaged(user.church_id, { status, q }, page, pageSize);
  const members = result.items;
  const posMap = await positionLabelMap(user.church_id);
  const filtered = Boolean(q || status);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader>
        <PageTitle>교적 ({result.total})</PageTitle>
        {canWrite && (
          <PageActions>
            <Button asChild>
              <Link href="/members/new">
                <UserPlus />
                교인 등록
              </Link>
            </Button>
          </PageActions>
        )}
      </PageHeader>

      <FilterBar>
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="이름 검색"
          className="w-auto"
        />
        <Select name="status" defaultValue={status ?? ""} className="w-auto">
          <option value="">전체 상태</option>
          {MEMBER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {MEMBER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          <Search />
          검색
        </Button>
        {filtered && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/members">초기화</Link>
          </Button>
        )}
      </FilterBar>

      {members.length === 0 ? (
        <EmptyState
          title="교인이 없습니다"
          description={
            filtered
              ? "검색 조건에 맞는 교인이 없습니다. 필터를 변경해 보세요."
              : "첫 교인을 등록하면 교적, 출석, 헌금 내역을 함께 관리할 수 있습니다."
          }
          action={
            canWrite && !filtered ? (
              <Button asChild>
                <Link href="/members/new">
                  <UserPlus />
                  교인 등록
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>직분</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>연락처</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.memberId}>
                  <TableCell>
                    <Link
                      href={`/members/${m.memberId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {m.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {m.gender ? GENDER_LABELS[m.gender as Gender] : "—"}
                  </TableCell>
                  <TableCell>
                    {(m.positionId ? posMap[m.positionId] : m.position) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[m.status] ?? "muted"}>
                      {MEMBER_STATUS_LABELS[m.status as MemberStatus] ?? m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
