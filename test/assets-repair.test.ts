import { describe, it, expect, afterAll } from "vitest";
import { createAsset } from "@church/module-assets/service";
import { addRepair, listRepairs, deleteRepair } from "@church/module-assets/repairs";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("자산 수리이력", () => {
  it("추가/조회/삭제 + 자산 연동 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { assetId } = await createAsset(a, { name: "에어컨" });
    const { repairId } = await addRepair(a, {
      assetId,
      description: "가스 충전",
      cost: "80000.00",
      vendor: "쿨링서비스",
    });

    const list = await listRepairs(a, assetId);
    expect(list).toHaveLength(1);
    expect(list[0]!.description).toBe("가스 충전");
    expect(list[0]!.cost).toBe("80000.00");

    // 다른 교회에서는 보이지 않음(RLS)
    expect(await listRepairs(b, assetId)).toHaveLength(0);

    await deleteRepair(a, repairId);
    expect(await listRepairs(a, assetId)).toHaveLength(0);
  });
});
