import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getForm } from "@/lib/forms/service";
import { exportResponsesCsv } from "@/lib/forms/aggregate";

/** 응답 CSV 내보내기 (S.5). forms:read. */
export async function GET(
  _req: Request,
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

  const csv = await exportResponsesCsv(res.user.church_id, formId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="responses-${formId}.csv"`,
    },
  });
}
