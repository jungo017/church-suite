import "server-only";
import { and, count, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { member, asset } from "@/lib/db/schema";

/** 대시보드 집계 (Phase 5.1). 테넌트 스코프. */
export async function dashboardCounts(churchId: string): Promise<{
  members: number;
  activeMembers: number;
  assets: number;
}> {
  return withTenant(churchId, async (tx) => {
    const m = await tx
      .select({ n: count() })
      .from(member)
      .where(eq(member.churchId, churchId));
    const active = await tx
      .select({ n: count() })
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.status, "active")));
    const a = await tx
      .select({ n: count() })
      .from(asset)
      .where(eq(asset.churchId, churchId));
    return {
      members: Number(m[0]?.n ?? 0),
      activeMembers: Number(active[0]?.n ?? 0),
      assets: Number(a[0]?.n ?? 0),
    };
  });
}
