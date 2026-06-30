import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { assetAudit, assetAuditItem, asset } from "@church/core/db/schema";

/**
 * 전수조사 서비스 (스펙 §7.1). 모두 테넌트 스코프.
 */

/** 조사 세션 생성 + 현재 자산을 항목으로 스냅샷(원자적). */
export async function createAudit(
  churchId: string,
  name: string,
): Promise<{ auditId: string }> {
  return withTenant(churchId, async (tx) => {
    const inserted = await tx
      .insert(assetAudit)
      .values({ churchId, name })
      .returning({ auditId: assetAudit.auditId });
    const auditId = inserted[0]!.auditId;

    const assets = await tx
      .select({ assetId: asset.assetId })
      .from(asset)
      .where(eq(asset.churchId, churchId));
    if (assets.length > 0) {
      await tx.insert(assetAuditItem).values(
        assets.map((a) => ({ churchId, auditId, assetId: a.assetId })),
      );
    }
    return { auditId };
  });
}

export async function listAudits(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(assetAudit)
      .where(eq(assetAudit.churchId, churchId))
      .orderBy(desc(assetAudit.createdAt)),
  );
}

export async function getAudit(churchId: string, auditId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(assetAudit)
      .where(and(eq(assetAudit.churchId, churchId), eq(assetAudit.auditId, auditId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

/** 조사 항목 목록(자산명/태그 조인). */
export async function listAuditItems(churchId: string, auditId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        itemId: assetAuditItem.itemId,
        assetId: assetAuditItem.assetId,
        name: asset.name,
        tag: asset.tag,
        checked: assetAuditItem.checked,
        checkedAt: assetAuditItem.checkedAt,
      })
      .from(assetAuditItem)
      .innerJoin(asset, eq(assetAuditItem.assetId, asset.assetId))
      .where(
        and(
          eq(assetAuditItem.churchId, churchId),
          eq(assetAuditItem.auditId, auditId),
        ),
      )
      .orderBy(asc(asset.name)),
  );
}

export async function checkItem(
  churchId: string,
  auditId: string,
  itemId: string,
  checked = true,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(assetAuditItem)
      .set({ checked, checkedAt: checked ? new Date() : null })
      .where(
        and(
          eq(assetAuditItem.churchId, churchId),
          eq(assetAuditItem.auditId, auditId),
          eq(assetAuditItem.itemId, itemId),
        ),
      ),
  );
}

/** 자산 태그로 항목 체크(QR 스캔). 매칭 항목이 있으면 true. */
export async function checkByTag(
  churchId: string,
  auditId: string,
  tag: string,
): Promise<boolean> {
  return withTenant(churchId, async (tx) => {
    const found = await tx
      .select({ assetId: asset.assetId })
      .from(asset)
      .where(and(eq(asset.churchId, churchId), eq(asset.tag, tag)))
      .limit(1);
    if (!found[0]) return false;
    const updated = await tx
      .update(assetAuditItem)
      .set({ checked: true, checkedAt: new Date() })
      .where(
        and(
          eq(assetAuditItem.churchId, churchId),
          eq(assetAuditItem.auditId, auditId),
          eq(assetAuditItem.assetId, found[0].assetId),
        ),
      )
      .returning({ itemId: assetAuditItem.itemId });
    return updated.length > 0;
  });
}

export async function closeAudit(
  churchId: string,
  auditId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(assetAudit)
      .set({ status: "closed", closedAt: new Date() })
      .where(and(eq(assetAudit.churchId, churchId), eq(assetAudit.auditId, auditId))),
  );
}
