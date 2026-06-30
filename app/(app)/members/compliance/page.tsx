import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { listAccessLogs } from "@church/core/compliance/access-log";
import { listConsents } from "@church/core/compliance/consent";

// 개인정보 컴플라이언스(접근로그·동의) — 관리자 전용 (스펙 §5).
export default async function CompliancePage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.CHURCH_MANAGE)) redirect("/forbidden");

  const [logs, consents] = await Promise.all([
    listAccessLogs(user.church_id, 50),
    listConsents(user.church_id, 50),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold">개인정보 컴플라이언스</h1>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">접근 기록 (민감정보)</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">기록 없음</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {logs.map((l) => (
              <li key={l.logId} className="flex justify-between border-b border-border py-1">
                <span>{l.action} · {l.targetType}/{l.targetId?.slice(0, 8)}</span>
                <span className="text-muted-foreground">
                  {new Date(l.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">동의 기록</h2>
        {consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">기록 없음</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {consents.map((c) => (
              <li key={c.consentId} className="flex justify-between border-b border-border py-1">
                <span>{c.subjectName ?? c.memberId?.slice(0, 8) ?? "—"} · {c.consentType} · {c.source ?? ""}</span>
                <span className={c.agreed ? "text-green-600" : "text-muted-foreground"}>
                  {c.agreed ? "동의" : "거부"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
