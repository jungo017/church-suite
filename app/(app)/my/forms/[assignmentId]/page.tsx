import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@/lib/members/portal";
import { getMyFillForm, myResponseDetail } from "@/lib/forms/my";
import { parseOptions } from "@/lib/forms/service";
import { parseFileAnswer } from "@/lib/forms/files";
import { submitMyResponseAction } from "@/lib/forms/my-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

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
        <div>
          <h1 className="text-2xl font-bold">{pf.assignment.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {done ? "제출 완료" : "마감되어 작성할 수 없습니다."}
          </p>
        </div>
        {detail && detail.answers.length > 0 && (
          <dl className="flex flex-col gap-3 text-sm">
            {detail.answers.map((aw) => (
              <div key={aw.answerId} className="border-b border-border pb-2">
                <dt className="font-medium">{aw.label}</dt>
                <dd className="mt-1 text-muted-foreground"><AnswerValue type={aw.type} value={aw.value} /></dd>
              </div>
            ))}
          </dl>
        )}
        <Link href="/my/forms" className="text-sm underline">← 목록으로</Link>
      </section>
    );
  }

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{pf.assignment.title}</h1>
        {pf.assignment.description && (
          <p className="mt-1 text-sm text-muted-foreground">{pf.assignment.description}</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">
          {error === "quota" ? "저장 용량을 초과했습니다." : "필수 문항을 입력해 주세요."}
        </p>
      )}

      <form
        action={submitMyResponseAction.bind(null, assignmentId)}
        encType="multipart/form-data"
        className="flex flex-col gap-4"
      >
        {pf.fields.map((f) => {
          const name = `field_${f.fieldId}`;
          const opts = parseOptions(f.options);
          return (
            <div key={f.fieldId} className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                {f.label}
                {f.required ? <span className="ml-1 text-destructive">*</span> : null}
              </label>
              {f.type === "short_text" && (
                <input name={name} required={f.required} className={input} />
              )}
              {f.type === "long_text" && (
                <textarea name={name} required={f.required} rows={3} className={input} />
              )}
              {f.type === "number" && (
                <input name={name} type="number" required={f.required} className={input} />
              )}
              {f.type === "date" && (
                <input name={name} type="date" required={f.required} className={input} />
              )}
              {f.type === "scale" && (
                <select name={name} required={f.required} className={input} defaultValue="">
                  <option value="" disabled>선택</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
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
                <input name={name} type="file" required={f.required} className={input} />
              )}
            </div>
          );
        })}
        <button className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          제출
        </button>
      </form>

      <Link href="/my/forms" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
