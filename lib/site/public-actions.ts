"use server";

import { redirect } from "next/navigation";
import { getTenant } from "@/lib/tenant/context";
import { submitNewFamily } from "./intake";
import { submitOnlineOffering } from "./offering";
import { recordConsent } from "@/lib/compliance/consent";

/**
 * 공개(비인증) 접수 서버 액션. 호스트로 교회를 해석해 접수 테이블에만 기록한다(스펙 §2.4).
 */
function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

export async function submitNewFamilyAction(fd: FormData) {
  const tenant = await getTenant();
  if (!tenant) redirect("/");
  const name = str(fd, "name");
  // 개인정보 수집·이용 동의 필수 (PIPA §5)
  if (!name || fd.get("consent") !== "on") {
    redirect("/online/new-family?error=1");
  }
  await submitNewFamily(tenant.churchId, {
    name,
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    address: str(fd, "address"),
    message: str(fd, "message"),
  });
  await recordConsent(tenant.churchId, {
    subjectName: name,
    consentType: "privacy",
    agreed: true,
    source: "newfamily",
  });
  redirect("/online/new-family?submitted=1");
}

export async function submitOnlineOfferingAction(fd: FormData) {
  const tenant = await getTenant();
  if (!tenant) redirect("/");
  const amountRaw = str(fd, "amount");
  const amount = Number(amountRaw);
  if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
    redirect("/online/offering?error=1");
  }
  await submitOnlineOffering(tenant.churchId, {
    donorName: str(fd, "donorName"),
    donorPhone: str(fd, "donorPhone"),
    offeringKind: str(fd, "offeringKind"),
    amount: amountRaw!,
    method: str(fd, "method"),
  });
  redirect("/online/offering?submitted=1");
}
