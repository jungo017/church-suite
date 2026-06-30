import "server-only";
import { asc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { department } from "@church/core/db/schema";

/**
 * 부서/구역(`department`) — **코어 공유 도메인**(스펙 §5.1, module-platform.md §5.1).
 * 교적(구역)·비품(부서) 등 여러 모듈이 `department_id` 로 참조하는 단일 원본이므로
 * CRUD 를 코어가 소유한다(모듈 간 직접 결합 제거 — AGENTS §4.1). 테넌트 스코프.
 */

export async function listDepartments(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(department)
      .where(eq(department.churchId, churchId))
      .orderBy(asc(department.name)),
  );
}

export async function createDepartment(
  churchId: string,
  name: string,
  parentId: string | null = null,
): Promise<{ departmentId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(department)
      .values({ churchId, name, parentId })
      .returning({ departmentId: department.departmentId });
    return { departmentId: rows[0]!.departmentId };
  });
}
