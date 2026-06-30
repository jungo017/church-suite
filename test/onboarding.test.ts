import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { withTenant, withSystem } from "@church/core/db/tenant";
import { subscription, churchStorageUsage, appUser } from "@church/core/db/schema";
import { onboardChurch, OnboardError } from "@/lib/onboarding/onboard";
import { getUserRoleNames } from "@church/core/auth/users";
import { deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교회 온보딩", () => {
  it("교회+구독+사용량+역할+관리자를 원자적으로 생성한다", async () => {
    const code = uniqueCode("ob");
    const { churchId, userId } = await onboardChurch({
      churchName: "온보딩 교회",
      churchCode: code,
      adminLoginId: "churchadmin",
      adminPassword: "pw12345678",
      adminName: "관리자",
    });
    created.push(churchId);

    // 구독 active + 사용량 레코드 존재(테넌트 스코프)
    const subs = await withTenant(churchId, (tx) =>
      tx.select().from(subscription).where(eq(subscription.churchId, churchId)),
    );
    expect(subs).toHaveLength(1);
    expect(subs[0]!.status).toBe("active");

    const usage = await withTenant(churchId, (tx) =>
      tx.select().from(churchStorageUsage),
    );
    expect(usage).toHaveLength(1);
    expect(usage[0]!.bytesUsed).toBe(0);

    // 관리자 사용자 + admin 역할
    const users = await withTenant(churchId, (tx) => tx.select().from(appUser));
    expect(users).toHaveLength(1);
    expect(await getUserRoleNames(churchId, userId)).toContain("admin");
  });

  it("중복 코드는 거부한다", async () => {
    const code = uniqueCode("ob");
    const { churchId } = await onboardChurch({
      churchName: "첫 교회",
      churchCode: code,
      adminLoginId: "churchadmin",
      adminPassword: "pw12345678",
    });
    created.push(churchId);

    await expect(
      onboardChurch({
        churchName: "둘째 교회",
        churchCode: code,
        adminLoginId: "churchadmin",
        adminPassword: "pw12345678",
      }),
    ).rejects.toBeInstanceOf(OnboardError);
  });

  it("잘못된 코드/짧은 비밀번호는 거부한다", async () => {
    await expect(
      onboardChurch({
        churchName: "x",
        churchCode: "Invalid Code!",
        adminLoginId: "churchadmin",
        adminPassword: "pw12345678",
      }),
    ).rejects.toBeInstanceOf(OnboardError);

    await expect(
      onboardChurch({
        churchName: "x",
        churchCode: uniqueCode("ob"),
        adminLoginId: "churchadmin",
        adminPassword: "short",
      }),
    ).rejects.toBeInstanceOf(OnboardError);
  });

  it("예약 서브도메인은 교회 코드로 거부한다", async () => {
    for (const code of ["admin", "api", "www", "platform", "mail"]) {
      await expect(
        onboardChurch({
          churchName: "예약 코드",
          churchCode: code,
          adminLoginId: "churchadmin",
          adminPassword: "pw12345678",
        }),
      ).rejects.toMatchObject({ code: "reserved_code" });
    }
  });

  it("예약된 관리자 로그인 아이디는 거부한다", async () => {
    await expect(
      onboardChurch({
        churchName: "예약 아이디",
        churchCode: uniqueCode("ob"),
        adminLoginId: "admin",
        adminPassword: "pw12345678",
      }),
    ).rejects.toMatchObject({ code: "invalid_admin_login" });
  });

  it("온보딩한 교회는 다른 교회 데이터와 격리된다", async () => {
    const c1 = await onboardChurch({
      churchName: "격리1",
      churchCode: uniqueCode("ob"),
      adminLoginId: "churchadmin",
      adminPassword: "pw12345678",
    });
    const c2 = await onboardChurch({
      churchName: "격리2",
      churchCode: uniqueCode("ob"),
      adminLoginId: "churchadmin",
      adminPassword: "pw12345678",
    });
    created.push(c1.churchId, c2.churchId);

    // c1 스코프에서는 c1 사용자만 보인다(c2 의 churchadmin 도 같은 loginId 이지만 격리됨)
    const c1Users = await withTenant(c1.churchId, (tx) =>
      tx.select().from(appUser),
    );
    expect(c1Users).toHaveLength(1);
    expect(c1Users[0]!.userId).toBe(c1.userId);

    // 시스템 컨텍스트로는 둘 다 보인다
    const all = await withSystem((tx) => tx.select().from(appUser));
    const ids = all.map((u) => u.userId);
    expect(ids).toContain(c1.userId);
    expect(ids).toContain(c2.userId);
  });
});
