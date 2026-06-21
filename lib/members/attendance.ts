import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { attendance } from "@/lib/db/schema";

/** 출석 서비스 (스펙 §7.2). 테넌트 스코프. */

export async function listServiceAttendance(
  churchId: string,
  serviceDate: string,
  serviceType: string,
) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.churchId, churchId),
          eq(attendance.serviceDate, serviceDate),
          eq(attendance.serviceType, serviceType),
        ),
      ),
  );
}

/** 예배별 출석 일괄 저장(upsert). */
export async function saveAttendance(
  churchId: string,
  serviceDate: string,
  serviceType: string,
  records: { memberId: string; present: boolean }[],
): Promise<void> {
  if (records.length === 0) return;
  await withTenant(churchId, async (tx) => {
    for (const r of records) {
      await tx
        .insert(attendance)
        .values({
          churchId,
          memberId: r.memberId,
          serviceDate,
          serviceType,
          present: r.present,
        })
        .onConflictDoUpdate({
          target: [
            attendance.memberId,
            attendance.serviceDate,
            attendance.serviceType,
          ],
          set: { present: r.present },
        });
    }
  });
}

export async function listMemberAttendance(
  churchId: string,
  memberId: string,
  limit = 20,
) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.churchId, churchId),
          eq(attendance.memberId, memberId),
        ),
      )
      .orderBy(desc(attendance.serviceDate))
      .limit(limit),
  );
}
