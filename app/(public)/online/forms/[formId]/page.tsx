import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant/context";
import { getPublicForm, } from "@/lib/forms/responses";
import { parseOptions } from "@/lib/forms/service";
import { submitPublicFormAction } from "@/lib/forms/public-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { formId } = await params;
  const { submitted, error } = await searchParams;
  const tenant = await getTenant();
  if (!tenant) notFound();
  const pf = await getPublicForm(tenant.churchId, formId);
  // 익명 공개 폼만 외부 노출
  if (!pf || !pf.form.anonymous) notFound();

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 py-12">
        <h1 className="text-2xl font-bold">{pf.form.title}</h1>
        <p className="text-sm text-green-600">응답이 제출되었습니다. 감사합니다!</p>
        <Link href="/" className="text-sm underline">← 홈으로</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">{pf.form.title}</h1>
        {pf.form.description && (
          <p className="mt-1 text-sm text-muted-foreground">{pf.form.description}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">필수 문항을 입력해 주세요.</p>}

      <form action={submitPublicFormAction.bind(null, formId)} className="flex flex-col gap-4">
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
                <p className="text-xs text-muted-foreground">(파일 업로드는 추후 제공)</p>
              )}
            </div>
          );
        })}
        <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          제출
        </button>
      </form>
    </main>
  );
}
