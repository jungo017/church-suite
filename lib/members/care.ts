import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { pastoralCare } from "@church/core/db/schema";

/** 목양 기록(심방/기도/상담) 서비스 (스펙 §7.2). 테넌트 스코프. */

export type CareInput = {
  memberId: string;
  careType: string;
  careDate?: string | null;
  content: string;
};

export async function listMemberCare(churchId: string, memberId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(pastoralCare)
      .where(
        and(
          eq(pastoralCare.churchId, churchId),
          eq(pastoralCare.memberId, memberId),
        ),
      )
      .orderBy(desc(pastoralCare.careDate)),
  );
}

export async function addCare(
  churchId: string,
  input: CareInput,
): Promise<{ careId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(pastoralCare)
      .values({
        churchId,
        memberId: input.memberId,
        careType: input.careType,
        careDate: input.careDate ?? null,
        content: input.content,
      })
      .returning({ careId: pastoralCare.careId });
    return { careId: rows[0]!.careId };
  });
}

export async function deleteCare(
  churchId: string,
  careId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(pastoralCare)
      .where(
        and(
          eq(pastoralCare.churchId, churchId),
          eq(pastoralCare.careId, careId),
        ),
      ),
  );
}
