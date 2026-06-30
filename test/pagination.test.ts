import { describe, it, expect, afterAll } from "vitest";
import { createMember, listMembersPaged } from "@church/module-members/service";
import { createAccount } from "@church/module-finance/accounts";
import {
  createVoucher,
  listVouchersPaged,
  voucherTotals,
} from "@church/module-finance/vouchers";
import { pageParams, toPaged } from "@church/core/db/pagination";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("페이지네이션 유틸", () => {
  it("pageParams 정규화/클램프", () => {
    expect(pageParams({ page: "2", size: "5" })).toEqual({ page: 2, pageSize: 5, offset: 5 });
    expect(pageParams({})).toMatchObject({ page: 1, offset: 0 });
    expect(pageParams({ page: "0" }).page).toBe(1); // 최소 1
    expect(pageParams({ size: "9999" }).pageSize).toBe(100); // 최대 100
  });
  it("toPaged totalPages 계산", () => {
    expect(toPaged([], 0, 1, 20).totalPages).toBe(1);
    expect(toPaged([], 25, 1, 10).totalPages).toBe(3);
  });
});

describe("교인 페이지네이션", () => {
  it("페이지별 슬라이스 + total + 정렬", async () => {
    const a = await createChurch();
    created.push(a);
    for (let i = 1; i <= 25; i++) {
      await createMember(a, { name: `교인${String(i).padStart(2, "0")}` });
    }
    const p1 = await listMembersPaged(a, {}, 1, 10);
    expect(p1.total).toBe(25);
    expect(p1.totalPages).toBe(3);
    expect(p1.items).toHaveLength(10);
    expect(p1.items[0]!.name).toBe("교인01"); // name asc

    const p3 = await listMembersPaged(a, {}, 3, 10);
    expect(p3.items).toHaveLength(5);
    expect(p3.items[0]!.name).toBe("교인21");
  });
});

describe("전표 합계(전체) vs 페이지(부분)", () => {
  it("합계는 전체 필터, 표는 페이지 단위", async () => {
    const a = await createChurch();
    created.push(a);
    const inc = await createAccount(a, { code: "101", name: "수입", type: "income" });
    const exp = await createAccount(a, { code: "501", name: "지출", type: "expense" });
    for (let i = 0; i < 3; i++)
      await createVoucher(a, { voucherDate: "2026-06-01", type: "income", accountId: inc.accountId, amount: "100" });
    for (let i = 0; i < 2; i++)
      await createVoucher(a, { voucherDate: "2026-06-02", type: "expense", accountId: exp.accountId, amount: "50" });

    const totals = await voucherTotals(a, {});
    expect(totals.income).toBe(300);
    expect(totals.expense).toBe(100);

    const paged = await listVouchersPaged(a, {}, 1, 2);
    expect(paged.total).toBe(5);
    expect(paged.totalPages).toBe(3);
    expect(paged.items).toHaveLength(2);
  });
});
