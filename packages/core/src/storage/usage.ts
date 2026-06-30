import "server-only";
import { eq, sql } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { churchStorageUsage, subscription, plan } from "@church/core/db/schema";

/**
 * 저장소 사용량/쿼터 (스펙 §10). church_storage_usage 카운터 유지(버킷 스캔 금지).
 */

export async function getUsage(churchId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(churchStorageUsage)
      .where(eq(churchStorageUsage.churchId, churchId))
      .limit(1),
  );
  return rows[0] ?? null;
}

/**
 * 업로드 직전 쿼터 확인 후 사용량을 증가시킨다(원자적).
 * 한도 초과 시 false(증가하지 않음). limit=0 은 무제한으로 본다.
 */
export async function reserveUsage(
  churchId: string,
  bytes: number,
  files = 1,
): Promise<boolean> {
  return withTenant(churchId, async (tx) => {
    const usage = await tx
      .select({ used: churchStorageUsage.bytesUsed })
      .from(churchStorageUsage)
      .where(eq(churchStorageUsage.churchId, churchId))
      .limit(1);
    const used = usage[0]?.used ?? 0;

    const limitRows = await tx
      .select({ limit: plan.storageLimit })
      .from(subscription)
      .innerJoin(plan, eq(subscription.planId, plan.planId))
      .where(eq(subscription.churchId, churchId))
      .limit(1);
    const limit = limitRows[0]?.limit ?? 0;

    if (limit > 0 && used + bytes > limit) return false;

    await tx
      .insert(churchStorageUsage)
      .values({ churchId, bytesUsed: bytes, fileCount: files })
      .onConflictDoUpdate({
        target: churchStorageUsage.churchId,
        set: {
          bytesUsed: sql`${churchStorageUsage.bytesUsed} + ${bytes}`,
          fileCount: sql`${churchStorageUsage.fileCount} + ${files}`,
        },
      });
    return true;
  });
}

/** 삭제 시 사용량 감소(0 미만 방지). */
export async function releaseUsage(
  churchId: string,
  bytes: number,
  files = 1,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(churchStorageUsage)
      .set({
        bytesUsed: sql`greatest(0, ${churchStorageUsage.bytesUsed} - ${bytes})`,
        fileCount: sql`greatest(0, ${churchStorageUsage.fileCount} - ${files})`,
      })
      .where(eq(churchStorageUsage.churchId, churchId)),
  );
}
