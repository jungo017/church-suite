import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { seedDefaultRoles } from "@/lib/rbac/seed";
import { createMemberUser, getUserMember, listMyGiving } from "@/lib/members/portal";
import { createAccount } from "@/lib/finance/accounts";
import { createVoucher } from "@/lib/finance/vouchers";
import { createChurch, deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교인 셀프 포털", () => {
  it("계정 발급 + 본인 연결 + 본인 헌금내역만 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await seedDefaultRoles(a);

    const m1 = await createMember(a, { name: "교인갑" });
    const m2 = await createMember(a, { name: "교인을" });

    const { userId } = await createMemberUser(a, m1.memberId, uniqueCode("login"), "pw12345678");

    const me = await getUserMember(a, userId);
    expect(me?.memberId).toBe(m1.memberId);
    expect(me?.name).toBe("교인갑");

    // 헌금: m1 2건, m2 1건 → 본인것만 조회
    const acc = await createAccount(a, { code: "101", name: "십일조", type: "income" });
    await createVoucher(a, { voucherDate: "2026-01-01", type: "income", accountId: acc.accountId, memberId: m1.memberId, amount: "10000" });
    await createVoucher(a, { voucherDate: "2026-02-01", type: "income", accountId: acc.accountId, memberId: m1.memberId, amount: "20000" });
    await createVoucher(a, { voucherDate: "2026-02-01", type: "income", accountId: acc.accountId, memberId: m2.memberId, amount: "99999" });

    const giving = await listMyGiving(a, m1.memberId);
    expect(giving).toHaveLength(2);
    expect(giving.reduce((s, g) => s + Number(g.amount), 0)).toBe(30000);

    // 격리: 다른 교회 스코프에선 이 사용자가 안 보임
    expect(await getUserMember(b, userId)).toBeNull();
  });
});
