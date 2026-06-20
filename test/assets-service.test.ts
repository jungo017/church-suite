import { describe, it, expect, afterAll } from "vitest";
import {
  createAsset,
  listAssets,
  getAsset,
  updateAsset,
  deleteAsset,
} from "@/lib/assets/service";
import { createCategory, listCategories } from "@/lib/assets/classification";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("자산 서비스 (CRUD + 격리 + 필터)", () => {
  it("생성/조회/수정/삭제가 동작하고 테넌트로 격리된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { assetId } = await createAsset(a, {
      name: "빔프로젝터",
      assetType: "equipment",
      acquiredCost: "1500000.00",
    });

    const got = await getAsset(a, assetId);
    expect(got?.name).toBe("빔프로젝터");
    expect(got?.acquiredCost).toBe("1500000.00"); // numeric 문자열 정확도

    // 다른 교회에서는 보이지 않음(RLS)
    expect(await getAsset(b, assetId)).toBeNull();

    // 수정
    await updateAsset(a, assetId, { status: "in_repair" });
    expect((await getAsset(a, assetId))?.status).toBe("in_repair");

    // 삭제
    await deleteAsset(a, assetId);
    expect(await getAsset(a, assetId)).toBeNull();
  });

  it("목록 필터(상태)가 동작한다", async () => {
    const a = await createChurch();
    created.push(a);
    await createAsset(a, { name: "의자", status: "idle" });
    await createAsset(a, { name: "책상", status: "in_use" });

    expect((await listAssets(a)).length).toBe(2);
    expect((await listAssets(a, { status: "idle" })).length).toBe(1);
    expect((await listAssets(a, { status: "idle" }))[0]!.name).toBe("의자");
  });

  it("분류(품목)도 테넌트로 격리된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await createCategory(a, "음향장비");
    expect((await listCategories(a)).length).toBe(1);
    expect((await listCategories(b)).length).toBe(0);
  });
});
