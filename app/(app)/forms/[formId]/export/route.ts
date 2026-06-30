import { checkPermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { getForm } from "@/lib/forms/service";
import { exportResponsesCsv } from "@/lib/forms/aggregate";
import { exportResponsesXlsx } from "@/lib/forms/xlsx";

/** 응답 내보내기 (S.5). forms:read. ?format=xlsx 또는 기본 csv. */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ formId: string }> },
) {
  const { formId } = await ctx.params;
  const res = await checkPermission(PERMISSIONS.FORMS_READ);
  if (!res.ok) {
    return new Response(res.error === "unauthenticated" ? "Unauthorized" : "Forbidden", {
      status: res.error === "unauthenticated" ? 401 : 403,
    });
  }
  const form = await getForm(res.user.church_id, formId);
  if (!form) return new Response("Not Found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format");

  if (format === "xlsx") {
    const buf = await exportResponsesXlsx(res.user.church_id, formId);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="responses-${formId}.xlsx"`,
      },
    });
  }

  const csv = await exportResponsesCsv(res.user.church_id, formId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="responses-${formId}.csv"`,
    },
  });
}
