import { describe, it, expect, afterAll } from "vitest";
import {
  createMember,
  getMember,
  listMembers,
  updateMember,
  deleteMember,
  createFamily,
  listFamilies,
} from "@/lib/members/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교인 서비스 (CRUD + 검색 + 격리)", () => {
  it("생성/조회/수정/삭제 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { memberId } = await createMember(a, {
      name: "홍길동",
      gender: "male",
      position: "집사",
      phone: "010-1234-5678",
    });
    const got = await getMember(a, memberId);
    expect(got?.name).toBe("홍길동");
    expect(got?.position).toBe("집사");

    // 다른 교회에서 안 보임
    expect(await getMember(b, memberId)).toBeNull();

    await updateMember(a, memberId, { position: "장로", status: "inactive" });
    const updated = await getMember(a, memberId);
    expect(updated?.position).toBe("장로");
    expect(updated?.status).toBe("inactive");

    await deleteMember(a, memberId);
    expect(await getMember(a, memberId)).toBeNull();
  });

  it("이름 검색·상태 필터", async () => {
    const a = await createChurch();
    created.push(a);
    await createMember(a, { name: "김철수", status: "active" });
    await createMember(a, { name: "이영희", status: "inactive" });

    expect((await listMembers(a)).length).toBe(2);
    expect((await listMembers(a, { q: "철수" })).length).toBe(1);
    expect((await listMembers(a, { status: "inactive" }))[0]!.name).toBe("이영희");
  });

  it("가족도 테넌트로 격리된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await createFamily(a, "홍길동 가정");
    expect((await listFamilies(a)).length).toBe(1);
    expect((await listFamilies(b)).length).toBe(0);
  });
});
