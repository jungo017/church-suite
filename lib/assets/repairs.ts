import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { assetRepair } from "@/lib/db/schema";

/** 자산 수리이력 서비스 (스펙 §7.1). 테넌트 스코프. */

export type RepairInput = {
  assetId: string;
  repairedAt?: string | null;
  description: string;
  cost?: string | null;
  vendor?: string | null;
};

export async function listRepairs(churchId: string, assetId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(assetRepair)
      .where(
        and(
          eq(assetRepair.churchId, churchId),
          eq(assetRepair.assetId, assetId),
        ),
      )
      .orderBy(desc(assetRepair.repairedAt)),
  );
}

export async function addRepair(
  churchId: string,
  input: RepairInput,
): Promise<{ repairId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(assetRepair)
      .values({
        churchId,
        assetId: input.assetId,
        description: input.description,
        repairedAt: input.repairedAt ?? null,
        cost: input.cost ?? null,
        vendor: input.vendor ?? null,
      })
      .returning({ repairId: assetRepair.repairId });
    return { repairId: rows[0]!.repairId };
  });
}

export async function deleteRepair(
  churchId: string,
  repairId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(assetRepair)
      .where(
        and(
          eq(assetRepair.churchId, churchId),
          eq(assetRepair.repairId, repairId),
        ),
      ),
  );
}
