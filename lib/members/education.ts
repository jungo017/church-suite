import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { educationProgram, educationEnrollment, member } from "@/lib/db/schema";

/** 교육 관리 서비스 (스펙 §7.2). 테넌트 스코프. */

export type ProgramInput = {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
};

export async function listPrograms(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(educationProgram)
      .where(eq(educationProgram.churchId, churchId))
      .orderBy(desc(educationProgram.createdAt)),
  );
}

export async function getProgram(churchId: string, programId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(educationProgram)
      .where(
        and(
          eq(educationProgram.churchId, churchId),
          eq(educationProgram.programId, programId),
        ),
      )
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createProgram(
  churchId: string,
  input: ProgramInput,
): Promise<{ programId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(educationProgram)
      .values({
        churchId,
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        status: input.status ?? "open",
      })
      .returning({ programId: educationProgram.programId });
    return { programId: rows[0]!.programId };
  });
}

export async function listEnrollments(churchId: string, programId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        enrollmentId: educationEnrollment.enrollmentId,
        memberId: educationEnrollment.memberId,
        name: member.name,
        status: educationEnrollment.status,
      })
      .from(educationEnrollment)
      .innerJoin(member, eq(educationEnrollment.memberId, member.memberId))
      .where(
        and(
          eq(educationEnrollment.churchId, churchId),
          eq(educationEnrollment.programId, programId),
        ),
      )
      .orderBy(asc(member.name)),
  );
}

export async function enroll(
  churchId: string,
  programId: string,
  memberId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .insert(educationEnrollment)
      .values({ churchId, programId, memberId })
      .onConflictDoNothing(),
  );
}

export async function setEnrollmentStatus(
  churchId: string,
  enrollmentId: string,
  status: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(educationEnrollment)
      .set({ status })
      .where(
        and(
          eq(educationEnrollment.churchId, churchId),
          eq(educationEnrollment.enrollmentId, enrollmentId),
        ),
      ),
  );
}

export async function removeEnrollment(
  churchId: string,
  enrollmentId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(educationEnrollment)
      .where(
        and(
          eq(educationEnrollment.churchId, churchId),
          eq(educationEnrollment.enrollmentId, enrollmentId),
        ),
      ),
  );
}
