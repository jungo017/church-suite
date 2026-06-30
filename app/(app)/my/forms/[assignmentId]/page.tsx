import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@church/core/member";
import { getMyFillForm, myResponseDetail } from "@church/module-forms/my";
import { parseOptions } from "@church/module-forms/service";
import { parseFileAnswer } from "@church/module-forms/files";
import { submitMyResponseAction } from "@church/module-forms/my-actions";
import {
  PageHeader,
  PageTitle,
  PageDescription,
} from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import { DescriptionList, DescriptionItem } from "@/lib/ui/description-list";
import { Field, FieldLabel, Input, Textarea, Select } from "@/lib/ui/form";

function fileHref(key: string, name: string): string {
  return `/files?key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}`;
}

function AnswerValue({ type, value }: { type: string; value: string | null }) {
  if (type === "file") {
    const ref = parseFileAnswer(value);
    return ref ? (
      <a href={fileHref(ref.key, ref.name)} className="underline">{ref.name}</a>
    ) : (
      <>—</>
    );
  }
  if (value == null || value === "") return <>—</>;
  if (type === "multi_choice") return <>{parseOptions(value).join(", ") || "—"}</>;
  return <>{value}</>;
}

export default async function MyFillPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { assignmentId } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);
  if (!me) notFound();

  const pf = await getMyFillForm(user.church_id, me.memberId, assignmentId);
  if (!pf) notFound();

  const done =
    pf.assignment.assignmentStatus === "submitted" ||
    pf.assignment.assignmentStatus === "reviewed";
  const open = pf.assignment.formStatus === "published";

  // 이미 제출했거나 마감 → 읽기전용
  if (done || !open) {
    const detail = await myResponseDetail(user.church_id, me.memberId, assignmentId);
    return (
      <section className="flex max-w-2xl flex-col gap-5">
        <PageHeader>
          <div>
            <PageTitle>{pf.assignment.title}</PageTitle>
            <PageDescription>
              {done ? (
                <Badge tone="success">제출 완료</Badge>
              ) : (
                "마감되어 작성할 수 없습니다."
              )}
            </PageDescription>
          </div>
        </PageHeader>
        {detail && detail.answers.length > 0 && (
          <DescriptionList className="sm:grid-cols-1">
            {detail.answers.map((aw) => (
              <DescriptionItem key={aw.answerId} label={aw.label}>
                <AnswerValue type={aw.type} value={aw.value} />
              </DescriptionItem>
            ))}
          </DescriptionList>
        )}
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/my/forms">
            <ArrowLeft />
            목록으로
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <div>
          <PageTitle>{pf.assignment.title}</PageTitle>
          {pf.assignment.description && (
            <PageDescription>{pf.assignment.description}</PageDescription>
          )}
        </div>
      </PageHeader>
      {error && (
        <EmptyState
          title={error === "quota" ? "저장 용량을 초과했습니다." : "필수 문항을 입력해 주세요."}
        />
      )}

      <form
        action={submitMyResponseAction.bind(null, assignmentId)}
        encType="multipart/form-data"
        className="flex flex-col gap-5"
      >
        {pf.fields.map((f) => {
          const name = `field_${f.fieldId}`;
          const opts = parseOptions(f.options);
          return (
            <Field key={f.fieldId}>
              <FieldLabel htmlFor={name} required={f.required}>
                {f.label}
              </FieldLabel>
              {f.type === "short_text" && (
                <Input id={name} name={name} required={f.required} />
              )}
              {f.type === "long_text" && (
                <Textarea id={name} name={name} required={f.required} rows={4} />
              )}
              {f.type === "number" && (
                <Input id={name} name={name} type="number" required={f.required} />
              )}
              {f.type === "date" && (
                <Input id={name} name={name} type="date" required={f.required} />
              )}
              {f.type === "scale" && (
                <Select id={name} name={name} required={f.required} defaultValue="">
                  <option value="" disabled>선택</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              )}
              {f.type === "single_choice" &&
                opts.map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={name} value={o} required={f.required} /> {o}
                  </label>
                ))}
              {f.type === "multi_choice" &&
                opts.map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name={name} value={o} /> {o}
                  </label>
                ))}
              {f.type === "file" && (
                <Input id={name} name={name} type="file" required={f.required} />
              )}
            </Field>
          );
        })}
        <Button type="submit" size="lg" className="w-fit">
          제출
        </Button>
      </form>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/my/forms">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
