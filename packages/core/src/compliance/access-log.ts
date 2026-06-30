import "server-only";
import { desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { accessLog } from "@church/core/db/schema";

/** 민감정보 접근 기록 (스펙 §5). append-only. */
export async function logAccess(
  churchId: string,
  opts: {
    userId?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
  },
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx.insert(accessLog).values({
      churchId,
      userId: opts.userId ?? null,
      action: opts.action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
    }),
  );
}

export async function listAccessLogs(churchId: string, limit = 100) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(accessLog)
      .where(eq(accessLog.churchId, churchId))
      .orderBy(desc(accessLog.createdAt))
      .limit(limit),
  );
}
