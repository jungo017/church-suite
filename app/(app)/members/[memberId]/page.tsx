import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getMember, listFamilies } from "@church/module-members/service";
import { listMemberCare } from "@church/module-members/care";
import { listMemberAttendance } from "@church/module-members/attendance";
import { listDepartments } from "@church/core/department";
import { positionLabelMap } from "@church/module-members/org";
import { logAccess } from "@church/core/compliance/access-log";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { DescriptionList, DescriptionItem } from "@/lib/ui/description-list";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  deleteMemberAction,
  addCareAction,
  deleteCareAction,
  createMemberUserAction,
} from "@church/module-members/actions";
import {
  GENDER_LABELS,
  MEMBER_STATUS_LABELS,
  CARE_TYPES,
  CARE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type Gender,
  type MemberStatus,
  type CareType,
  type ServiceType,
} from "@church/module-members/constants";

// 교인 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  inactive: "muted",
  transferred: "muted",
  deceased: "destructive",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.MEMBERS_READ)) redirect("/forbidden");
  const m = await getMember(user.church_id, memberId);
  if (!m) notFound();
  // 민감정보(교인 상세) 접근 기록 (PIPA §5)
  await logAccess(user.church_id, {
    userId: user.sub,
    action: "member.view",
    targetType: "member",
    targetId: m.memberId,
  });
  const canWrite = hasPermission(user.roles, PERMISSIONS.MEMBERS_WRITE);

  const [departments, families, posMap] = await Promise.all([
    listDepartments(user.church_id),
    listFamilies(user.church_id),
    positionLabelMap(user.church_id),
  ]);
  const positionLabel = m.positionId ? (posMap[m.positionId] ?? null) : m.position;
  const deptName = departments.find((d) => d.departmentId === m.departmentId)?.name;
  const familyName = families.find((f) => f.familyId === m.familyId)?.name;
  const [care, recentAttendance] = await Promise.all([
    listMemberCare(user.church_id, m.memberId),
    listMemberAttendance(user.church_id, m.memberId, 8),
  ]);
  const careInput =
    "rounded-md border border-border px-2 py-1 text-sm dark:bg-transparent";

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <PageHeader>
        <PageTitle>{m.name}</PageTitle>
        {canWrite && (
          <PageActions>
            <Button asChild variant="outline">
              <Link href={`/members/${m.memberId}/edit`}>
                <Pencil />
                편집
              </Link>
            </Button>
            <form action={deleteMemberAction.bind(null, m.memberId)}>
              <Button type="submit" variant="destructive">
                <Trash2 />
                삭제
              </Button>
            </form>
          </PageActions>
        )}
      </PageHeader>

      <DescriptionList>
        <DescriptionItem label="상태">
          <Badge tone={STATUS_TONE[m.status] ?? "muted"}>
            {MEMBER_STATUS_LABELS[m.status as MemberStatus] ?? m.status}
          </Badge>
        </DescriptionItem>
        <DescriptionItem label="성별">
          {m.gender ? GENDER_LABELS[m.gender as Gender] : null}
        </DescriptionItem>
        <DescriptionItem label="생년월일">{m.birth}</DescriptionItem>
        <DescriptionItem label="직분">{positionLabel}</DescriptionItem>
        <DescriptionItem label="구역/부서">{deptName}</DescriptionItem>
        <DescriptionItem label="가족">{familyName}</DescriptionItem>
        <DescriptionItem label="연락처">{m.phone}</DescriptionItem>
        <DescriptionItem label="이메일">{m.email}</DescriptionItem>
        <DescriptionItem label="주소">{m.address}</DescriptionItem>
        <DescriptionItem label="등록일">{m.registeredDate}</DescriptionItem>
      </DescriptionList>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">목양 기록</h2>
        {care.length === 0 ? (
          <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>구분</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>내용</TableHead>
                  {canWrite && <TableHead className="text-right">관리</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {care.map((c) => (
                  <TableRow key={c.careId}>
                    <TableCell>
                      <Badge tone="muted">
                        {CARE_TYPE_LABELS[c.careType as CareType] ?? c.careType}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.careDate ?? "—"}
                    </TableCell>
                    <TableCell>{c.content}</TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <form action={deleteCareAction.bind(null, m.memberId, c.careId)}>
                          <Button type="submit" variant="destructive" size="sm">
                            <Trash2 />
                            삭제
                          </Button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {canWrite && (
          <form action={addCareAction.bind(null, m.memberId)} className="flex flex-wrap items-end gap-2">
            <select name="careType" className={careInput} defaultValue="visitation">
              {CARE_TYPES.map((t) => (
                <option key={t} value={t}>{CARE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input name="careDate" type="date" className={careInput} />
            <input name="content" required placeholder="내용" className={`${careInput} flex-1`} />
            <Button type="submit">기록 추가</Button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">최근 출석</h2>
        {recentAttendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">출석 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일자</TableHead>
                  <TableHead>예배</TableHead>
                  <TableHead>출결</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance.map((r) => (
                  <TableRow key={r.attendanceId}>
                    <TableCell className="tabular-nums">{r.serviceDate}</TableCell>
                    <TableCell>
                      {SERVICE_TYPE_LABELS[r.serviceType as ServiceType] ?? r.serviceType}
                    </TableCell>
                    <TableCell>
                      <Badge tone={r.present ? "success" : "muted"}>
                        {r.present ? "출석" : "결석"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {canWrite && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">교인 셀프포털 계정</h2>
          <p className="text-xs text-muted-foreground">
            교인이 직접 로그인해 본인 정보·헌금내역을 볼 수 있는 계정을 발급합니다.
          </p>
          <form action={createMemberUserAction.bind(null, m.memberId)} className="flex flex-wrap items-end gap-2">
            <input name="loginId" required placeholder="로그인 아이디" className={careInput} />
            <input name="password" type="password" required placeholder="비밀번호(8자+)" className={careInput} />
            <Button type="submit">계정 발급</Button>
          </form>
        </section>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
