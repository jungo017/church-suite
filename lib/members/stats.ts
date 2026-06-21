import "server-only";
import { count, desc, sql } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { member, attendance } from "@/lib/db/schema";

/**
 * 교적 통계 (스펙 §7.2). 집계는 RLS 스코프(withTenant) 안에서 수행.
 */

export type Bucket = { key: string | null; n: number };

export async function memberStats(churchId: string): Promise<{
  total: number;
  byStatus: Bucket[];
  byGender: Bucket[];
  byPosition: Bucket[];
}> {
  return withTenant(churchId, async (tx) => {
    const byStatus = await tx
      .select({ key: member.status, n: count() })
      .from(member)
      .groupBy(member.status);
    const byGender = await tx
      .select({ key: member.gender, n: count() })
      .from(member)
      .groupBy(member.gender);
    const byPosition = await tx
      .select({ key: member.position, n: count() })
      .from(member)
      .groupBy(member.position);

    const total = byStatus.reduce((s, r) => s + Number(r.n), 0);
    const sortDesc = (a: Bucket, b: Bucket) => b.n - a.n;
    return {
      total,
      byStatus: [...byStatus].sort(sortDesc),
      byGender: [...byGender].sort(sortDesc),
      byPosition: [...byPosition].sort(sortDesc),
    };
  });
}

/** 최근 예배별 출석 추이. */
export async function attendanceTrend(
  churchId: string,
  limit = 10,
): Promise<{ date: string | null; serviceType: string; present: number }[]> {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        date: attendance.serviceDate,
        serviceType: attendance.serviceType,
        present: sql<number>`count(*) filter (where ${attendance.present})::int`,
      })
      .from(attendance)
      .groupBy(attendance.serviceDate, attendance.serviceType)
      .orderBy(desc(attendance.serviceDate))
      .limit(limit),
  );
}
