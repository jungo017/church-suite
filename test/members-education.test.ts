import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import {
  createProgram,
  listPrograms,
  enroll,
  listEnrollments,
  setEnrollmentStatus,
  removeEnrollment,
} from "@/lib/members/education";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교육 관리", () => {
  it("과정/수강 등록·상태·제거 + 중복방지 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "수강생" });

    const { programId } = await createProgram(a, { name: "새가족반" });
    expect((await listPrograms(a)).length).toBe(1);
    expect((await listPrograms(b)).length).toBe(0);

    await enroll(a, programId, memberId);
    await enroll(a, programId, memberId); // 중복 → onConflictDoNothing
    const enr = await listEnrollments(a, programId);
    expect(enr).toHaveLength(1);
    expect(enr[0]!.name).toBe("수강생");
    expect(enr[0]!.status).toBe("enrolled");

    await setEnrollmentStatus(a, enr[0]!.enrollmentId, "completed");
    expect((await listEnrollments(a, programId))[0]!.status).toBe("completed");

    // 격리
    expect(await listEnrollments(b, programId)).toHaveLength(0);

    await removeEnrollment(a, enr[0]!.enrollmentId);
    expect(await listEnrollments(a, programId)).toHaveLength(0);
  });
});
