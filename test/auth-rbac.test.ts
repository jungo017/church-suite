import { describe, it, expect, afterAll } from "vitest";
import {
  createUser,
  findUserByLogin,
  getUserRoleNames,
} from "@/lib/auth/users";
import { seedDefaultRoles, assignRole } from "@/lib/rbac/seed";
import { ROLES } from "@/lib/rbac/roles";
import { createChurch, deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("인증·RBAC 테넌트 격리", () => {
  it("사용자 조회가 테넌트로 스코프된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const login = uniqueCode("user");
    await createUser({
      churchId: a,
      loginId: login,
      password: "pw123456",
      name: "A user",
    });

    expect(await findUserByLogin(a, login)).not.toBeNull();
    // 동일 loginId 라도 다른 교회(B)에서는 보이지 않는다
    expect(await findUserByLogin(b, login)).toBeNull();
  });

  it("역할 시드·부여 후 역할이 테넌트로 스코프된다", async () => {
    const a = await createChurch();
    created.push(a);
    await seedDefaultRoles(a);

    const login = uniqueCode("user");
    const { userId } = await createUser({
      churchId: a,
      loginId: login,
      password: "pw123456",
      name: "A",
    });
    await assignRole(a, userId, ROLES.ADMIN);

    expect(await getUserRoleNames(a, userId)).toContain("admin");

    // 다른 교회 컨텍스트에서는 이 사용자의 역할이 보이지 않는다
    const b = await createChurch();
    created.push(b);
    expect(await getUserRoleNames(b, userId)).toHaveLength(0);
  });
});
