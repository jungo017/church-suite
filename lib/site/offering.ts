import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { onlineOffering, voucher } from "@/lib/db/schema";

/**
 * 온라인 헌금 접수 (스펙 §7.4). 공개 제출 → (PG) → 어드민 재정 반영(전표 생성).
 * ⚠️ 실제 PG 연동은 추후(스펙 §14). 여기서는 제출 시 'paid'(mock)로 둔다.
 */

export type OfferingInput = {
  donorName?: string | null;
  donorPhone?: string | null;
  offeringKind?: string | null;
  amount: string;
  method?: string | null;
  memberId?: string | null;
};

export async function submitOnlineOffering(
  churchId: string,
  input: OfferingInput,
): Promise<{ offeringId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(onlineOffering)
      .values({
        churchId,
        donorName: input.donorName ?? null,
        donorPhone: input.donorPhone ?? null,
        offeringKind: input.offeringKind ?? null,
        amount: input.amount,
        method: input.method ?? "card",
        memberId: input.memberId ?? null,
        status: "paid", // mock PG 결제완료
      })
      .returning({ offeringId: onlineOffering.offeringId });
    return { offeringId: rows[0]!.offeringId };
  });
}

export async function listOnlineOfferings(churchId: string, status?: string) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(onlineOffering.churchId, churchId)];
    if (status) conds.push(eq(onlineOffering.status, status));
    return tx
      .select()
      .from(onlineOffering)
      .where(and(...conds))
      .orderBy(desc(onlineOffering.createdAt));
  });
}

/** 재정 반영 → 수입 전표 생성 + 상태 reflected + voucherId 연결(원자적). */
export async function reflectOffering(
  churchId: string,
  offeringId: string,
  accountId: string,
  voucherDate: string,
): Promise<{ voucherId: string } | null> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select()
      .from(onlineOffering)
      .where(
        and(
          eq(onlineOffering.churchId, churchId),
          eq(onlineOffering.offeringId, offeringId),
        ),
      )
      .limit(1);
    const off = rows[0];
    if (!off || off.status === "reflected") return null;

    const vRows = await tx
      .insert(voucher)
      .values({
        churchId,
        voucherDate,
        type: "income",
        accountId,
        memberId: off.memberId,
        amount: off.amount,
        method: off.method,
        summary: `온라인헌금${off.offeringKind ? ` (${off.offeringKind})` : ""}`,
      })
      .returning({ voucherId: voucher.voucherId });
    const voucherId = vRows[0]!.voucherId;

    await tx
      .update(onlineOffering)
      .set({ status: "reflected", voucherId })
      .where(
        and(
          eq(onlineOffering.churchId, churchId),
          eq(onlineOffering.offeringId, offeringId),
        ),
      );
    return { voucherId };
  });
}
