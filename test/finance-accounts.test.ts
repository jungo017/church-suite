import { describe, it, expect, afterAll } from "vitest";
import { createAccount, listAccounts, getAccount, updateAccount } from "@church/module-finance/accounts";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("계정과목", () => {
  it("생성/조회/수정/필터 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { accountId } = await createAccount(a, { code: "101", name: "십일조", type: "income" });
    await createAccount(a, { code: "501", name: "선교비", type: "expense" });

    expect((await listAccounts(a)).length).toBe(2);
    expect((await listAccounts(a, { type: "income" })).length).toBe(1);
    expect((await getAccount(a, accountId))?.name).toBe("십일조");

    // 다른 교회 격리
    expect(await getAccount(b, accountId)).toBeNull();
    expect((await listAccounts(b)).length).toBe(0);

    await updateAccount(a, accountId, { active: false });
    expect((await getAccount(a, accountId))?.active).toBe(false);
  });
});
