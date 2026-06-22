import "server-only";
import { sql } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { listFields, parseOptions } from "./service";
import { listResponses } from "./responses";
import { parseFileAnswer } from "./files";

/**
 * 설문·보고 집계/통계 + 내보내기 (S.5, module-survey-report.md §4.1·§9).
 * 복잡 집계는 raw SQL(스펙 §4). RLS(withTenant) 스코프 안에서 실행.
 */

export type FieldDistribution = {
  fieldId: string;
  label: string;
  type: string;
  answered: number;
  values: { value: string; count: number }[];
};

/** 문항별 응답 분포(선택/척도 등 값별 카운트). */
export async function fieldDistributions(
  churchId: string,
  formId: string,
): Promise<FieldDistribution[]> {
  return withTenant(churchId, async (tx) => {
    const rows = (await tx.execute(sql`
      select
        ff.field_id as field_id,
        ff.label    as label,
        ff.type     as type,
        ff.sort     as sort,
        fa.value    as value,
        count(fa.answer_id)::int as cnt
      from form_field ff
      left join form_answer fa on fa.field_id = ff.field_id
      where ff.form_id = ${formId}
      group by ff.field_id, ff.label, ff.type, ff.sort, fa.value
      order by ff.sort, cnt desc
    `)) as unknown as {
      field_id: string;
      label: string;
      type: string;
      sort: number;
      value: string | null;
      cnt: number;
    }[];

    const byField = new Map<string, FieldDistribution>();
    const order: string[] = [];
    for (const r of rows) {
      let d = byField.get(r.field_id);
      if (!d) {
        d = { fieldId: r.field_id, label: r.label, type: r.type, answered: 0, values: [] };
        byField.set(r.field_id, d);
        order.push(r.field_id);
      }
      if (r.value != null && r.cnt > 0) {
        d.values.push({ value: r.value, count: r.cnt });
        d.answered += r.cnt;
      }
    }
    return order.map((id) => byField.get(id)!);
  });
}

export type DeptSubmissionRow = {
  departmentId: string;
  departmentName: string;
  total: number;
  submitted: number;
};

/**
 * 속/구역별 제출률 — 폼의 period_year 편성(org_membership)으로 배정 대상을 조직에 귀속.
 * PRE.0(연도별 편성)을 활용. period_year 가 없으면 빈 결과.
 */
export async function submissionByDepartment(
  churchId: string,
  formId: string,
): Promise<DeptSubmissionRow[]> {
  return withTenant(churchId, async (tx) => {
    const rows = (await tx.execute(sql`
      select
        d.department_id as department_id,
        d.name          as department_name,
        count(*)::int   as total,
        count(*) filter (where fa.status in ('submitted','reviewed'))::int as submitted
      from form_assignment fa
      join form f on f.form_id = fa.form_id
      join org_membership om
        on om.member_id = fa.member_id
       and om.church_id = fa.church_id
       and om.period_year = f.period_year
       and om.status = 'active'
      join department d on d.department_id = om.department_id
      where fa.form_id = ${formId}
      group by d.department_id, d.name
      order by d.name
    `)) as unknown as {
      department_id: string;
      department_name: string;
      total: number;
      submitted: number;
    }[];
    return rows.map((r) => ({
      departmentId: r.department_id,
      departmentName: r.department_name,
      total: Number(r.total),
      submitted: Number(r.submitted),
    }));
  });
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** 응답 전체를 CSV 로 — 헤더=문항 라벨, 행=응답별 답변. Excel 호환(BOM). */
export async function exportResponsesCsv(
  churchId: string,
  formId: string,
): Promise<string> {
  const [fields, responses] = await Promise.all([
    listFields(churchId, formId),
    listResponses(churchId, formId),
  ]);

  // 응답×문항 답변 맵
  const answerMap = new Map<string, Map<string, string>>();
  await withTenant(churchId, async (tx) => {
    const rows = (await tx.execute(sql`
      select a.response_id as response_id, a.field_id as field_id, a.value as value
      from form_response r
      join form_answer a on a.response_id = r.response_id
      where r.form_id = ${formId}
    `)) as unknown as {
      response_id: string;
      field_id: string;
      value: string | null;
    }[];
    for (const r of rows) {
      if (!answerMap.has(r.response_id)) answerMap.set(r.response_id, new Map());
      answerMap.get(r.response_id)!.set(r.field_id, r.value ?? "");
    }
  });

  const header = ["제출자", "제출시각", ...fields.map((f) => f.label)];
  const lines = [header.map(csvCell).join(",")];

  for (const resp of responses) {
    const ans = answerMap.get(resp.responseId) ?? new Map<string, string>();
    const row = [
      resp.memberName ?? "익명",
      resp.submittedAt ? new Date(resp.submittedAt).toISOString() : "",
      ...fields.map((f) => {
        const raw = ans.get(f.fieldId) ?? "";
        if (!raw) return "";
        if (f.type === "multi_choice") return parseOptions(raw).join(" / ");
        if (f.type === "file") return parseFileAnswer(raw)?.name ?? "";
        return raw;
      }),
    ];
    lines.push(row.map(csvCell).join(","));
  }
  return "﻿" + lines.join("\n"); // BOM: Excel 한글 인코딩
}
