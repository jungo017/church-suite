import { describe, it, expect, afterAll } from "vitest";
import {
  submitNewFamily,
  listNewFamilyReqs,
  approveNewFamily,
  rejectNewFamily,
} from "@church/module-site/intake";
import { listMembers } from "@church/module-members/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("새가족 등록 접수", () => {
  it("제출 → 승인(교인전환) / 거절 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { reqId } = await submitNewFamily(a, { name: "새가족", phone: "010-0000-0000" });
    let reqs = await listNewFamilyReqs(a);
    expect(reqs).toHaveLength(1);
    expect(reqs[0]!.status).toBe("pending");

    // 격리: 다른 교회에선 안 보임
    expect(await listNewFamilyReqs(b)).toHaveLength(0);

    // 승인 → 교인 생성
    const res = await approveNewFamily(a, reqId, "2026-06-01");
    expect(res?.memberId).toBeTruthy();
    reqs = await listNewFamilyReqs(a);
    expect(reqs[0]!.status).toBe("approved");
    expect(reqs[0]!.memberId).toBe(res!.memberId);

    const members = await listMembers(a, { q: "새가족" });
    expect(members).toHaveLength(1);

    // 거절
    const r2 = await submitNewFamily(a, { name: "거절대상" });
    await rejectNewFamily(a, r2.reqId);
    const rejected = (await listNewFamilyReqs(a, "rejected"))[0];
    expect(rejected!.name).toBe("거절대상");
  });
});
