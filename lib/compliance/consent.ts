import "server-only";
import { desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { consent } from "@church/core/db/schema";

/** 개인정보 수집·이용 동의 기록 (스펙 §5, §14). */
export async function recordConsent(
  churchId: string,
  opts: {
    memberId?: string | null;
    subjectName?: string | null;
    consentType?: string;
    agreed?: boolean;
    source?: string | null;
  },
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx.insert(consent).values({
      churchId,
      memberId: opts.memberId ?? null,
      subjectName: opts.subjectName ?? null,
      consentType: opts.consentType ?? "privacy",
      agreed: opts.agreed ?? true,
      source: opts.source ?? null,
    }),
  );
}

export async function listConsents(churchId: string, limit = 100) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(consent)
      .where(eq(consent.churchId, churchId))
      .orderBy(desc(consent.createdAt))
      .limit(limit),
  );
}
