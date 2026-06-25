import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listPrograms } from "@/lib/members/education";
import { createProgramAction } from "@/lib/members/education-actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Field, FieldLabel, Input } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@/lib/members/constants";

// 과정 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  open: "success",
  closed: "muted",
};

export default async function EducationPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const programs = await listPrograms(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <PageTitle>교육 관리</PageTitle>
      </PageHeader>

      <form action={createProgramAction} className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="name" required>
            과정명
          </FieldLabel>
          <Input id="name" name="name" required placeholder="예: 새가족반" />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">설명</FieldLabel>
          <Input id="description" name="description" placeholder="설명" />
        </Field>
        <div className="flex flex-wrap items-end gap-2">
          <Input name="startDate" type="date" className="w-auto" />
          <Input name="endDate" type="date" className="w-auto" />
          <Button type="submit">
            <Plus />
            과정 생성
          </Button>
        </div>
      </form>

      {programs.length === 0 ? (
        <EmptyState
          title="교육 과정이 없습니다"
          description="첫 교육 과정을 생성하면 수강생 등록과 수료 현황을 관리할 수 있습니다."
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {programs.map((p) => (
            <li
              key={p.programId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link
                href={`/members/education/${p.programId}`}
                className="font-medium text-foreground hover:underline"
              >
                {p.name}
              </Link>
              <Badge tone={STATUS_TONE[p.status] ?? "muted"}>
                {PROGRAM_STATUS_LABELS[p.status as ProgramStatus] ?? p.status}
              </Badge>
            </li>
          ))}
        </ul>
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
