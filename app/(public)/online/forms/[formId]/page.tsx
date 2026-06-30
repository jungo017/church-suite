import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@church/core/tenant/context";
import { getPublicForm, } from "@church/module-forms/responses";
import { parseOptions } from "@church/module-forms/service";
import { submitPublicFormAction } from "@church/module-forms/public-actions";
import { Button } from "@/lib/ui/button";
import { PublicContainer } from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";
import { Field, FieldLabel, Input, Textarea, Select } from "@/lib/ui/form";

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
      <PublicContainer className="flex min-h-screen max-w-md flex-col justify-center gap-4">
        <PublicPageTitle>{pf.form.title}</PublicPageTitle>
        <p className="text-sm text-success">응답이 제출되었습니다. 감사합니다!</p>
        <Link href="/" className="text-sm underline">← 홈으로</Link>
      </PublicContainer>
    );
  }

  return (
    <PublicContainer className="flex min-h-screen max-w-md flex-col gap-5">
      <div>
        <PublicPageTitle>{pf.form.title}</PublicPageTitle>
        {pf.form.description && (
          <p className="mt-1 text-sm text-muted-foreground">{pf.form.description}</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">
          {error === "quota" ? "저장 용량을 초과했습니다." : "필수 문항을 입력해 주세요."}
        </p>
      )}

      <form
        action={submitPublicFormAction.bind(null, formId)}
        encType="multipart/form-data"
        className="flex flex-col gap-4"
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
                <Textarea id={name} name={name} required={f.required} rows={3} />
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
        <Button type="submit" size="lg">제출</Button>
      </form>
    </PublicContainer>
  );
}
