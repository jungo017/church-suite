import { describe, it, expect, afterAll } from "vitest";
import { createAsset } from "@/lib/assets/service";
import {
  createAudit,
  listAuditItems,
  checkByTag,
  checkItem,
  getAudit,
  closeAudit,
} from "@/lib/assets/audit";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("전수조사", () => {
  it("스냅샷 생성 + 태그/항목 체크 + 마감 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await createAsset(a, { name: "노트북", tag: "T-1" });
    await createAsset(a, { name: "프린터" });

    const { auditId } = await createAudit(a, "2026 상반기");

    // 현재 자산 2건이 항목으로 스냅샷됨
    let items = await listAuditItems(a, auditId);
    expect(items).toHaveLength(2);
    expect(items.every((i) => !i.checked)).toBe(true);

    // 태그로 체크
    expect(await checkByTag(a, auditId, "T-1")).toBe(true);
    expect(await checkByTag(a, auditId, "NOPE")).toBe(false);

    items = await listAuditItems(a, auditId);
    expect(items.filter((i) => i.checked)).toHaveLength(1);

    // 나머지 항목 수동 체크
    const remaining = items.find((i) => !i.checked)!;
    await checkItem(a, auditId, remaining.itemId, true);
    items = await listAuditItems(a, auditId);
    expect(items.every((i) => i.checked)).toBe(true);

    // 다른 교회에서는 항목이 보이지 않음(RLS)
    expect(await listAuditItems(b, auditId)).toHaveLength(0);

    // 마감
    await closeAudit(a, auditId);
    expect((await getAudit(a, auditId))?.status).toBe("closed");
  });
});
