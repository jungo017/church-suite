import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { withSystem } from "@church/core/db/tenant";
import { church } from "@church/core/db/schema";

export { closeDb } from "@church/core/db";

/** 충돌 없는 짧은 식별자(서브도메인/코드 규칙에 맞게 하이픈 사용). */
export function uniqueCode(prefix = "t"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

/** 테스트용 교회 생성(시스템 컨텍스트). churchId 반환. */
export async function createChurch(name = "Test Church"): Promise<string> {
  const churchId = randomUUID();
  await withSystem((tx) =>
    tx.insert(church).values({ churchId, name, code: uniqueCode("c") }),
  );
  return churchId;
}

/** 테스트 교회 정리(cascade: members/users/roles/tokens). */
export async function deleteChurches(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withSystem((tx) =>
    tx.delete(church).where(inArray(church.churchId, ids)),
  );
}
