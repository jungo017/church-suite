import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { createDepartment } from "@church/core/department";
import {
  seedDefaultPositions,
  seedDefaultOrgRoles,
  listPositions,
  createPosition,
  listOrgRoles,
  createOrgRole,
  assignMembership,
  listMemberships,
  removeMembership,
  listLeaders,
} from "@/lib/members/org";
import { DEFAULT_POSITIONS, DEFAULT_ORG_ROLES } from "@/lib/members/org-constants";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("직분/직책 마스터 (PRE-1·PRE-3)", () => {
  it("시드는 멱등하고, 교회가 직분을 추가할 수 있으며, 테넌트 격리된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await seedDefaultPositions(a);
    await seedDefaultPositions(a); // 재시드 → onConflictDoNothing (멱등)
    const posA = await listPositions(a);
    expect(posA).toHaveLength(DEFAULT_POSITIONS.length);

    // 교회가 직분 추가
    await createPosition(a, { label: "권찰" });
    expect(await listPositions(a)).toHaveLength(DEFAULT_POSITIONS.length + 1);

    // 격리: b 는 시드/추가 영향 없음
    expect(await listPositions(b)).toHaveLength(0);
  });

  it("직책은 is_leader 를 갖고 추가 가능하다", async () => {
    const a = await createChurch();
    created.push(a);
    await seedDefaultOrgRoles(a);
    const roles = await listOrgRoles(a);
    expect(roles.length).toBe(DEFAULT_ORG_ROLES.length);
    expect(roles.find((r) => r.code === "class_leader")?.isLeader).toBe(true);
    expect(roles.find((r) => r.code === "class_member")?.isLeader).toBe(false);

    // 교회가 리더 직책 추가
    await createOrgRole(a, { label: "협동총무", isLeader: false });
    expect(await listOrgRoles(a)).toHaveLength(DEFAULT_ORG_ROLES.length + 1);
  });
});

describe("연도별 조직 편성 (org_membership)", () => {
  it("다중 소속·연도 분리·upsert·리더 식별·격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await seedDefaultOrgRoles(a);

    const { memberId } = await createMember(a, { name: "김속장" });
    const cell = await createDepartment(a, "1속"); // 속
    const choir = await createDepartment(a, "찬양대"); // 부서
    const roles = await listOrgRoles(a);
    const leaderRole = roles.find((r) => r.code === "class_leader")!;
    const memberRole = roles.find((r) => r.code === "member")!;

    // 다중 소속: 같은 교인이 같은 해 두 조직에 동시 소속
    await assignMembership(a, {
      memberId,
      departmentId: cell.departmentId,
      periodYear: 2026,
      orgRoleId: leaderRole.orgRoleId,
    });
    await assignMembership(a, {
      memberId,
      departmentId: choir.departmentId,
      periodYear: 2026,
      orgRoleId: memberRole.orgRoleId,
    });
    expect(await listMemberships(a, { periodYear: 2026 })).toHaveLength(2);

    // 연도 분리: 2025 는 별개(작년 편성 이력 보존)
    await assignMembership(a, {
      memberId,
      departmentId: cell.departmentId,
      periodYear: 2025,
      orgRoleId: memberRole.orgRoleId,
    });
    expect(await listMemberships(a, { periodYear: 2025 })).toHaveLength(1);
    expect(await listMemberships(a, { periodYear: 2026 })).toHaveLength(2);

    // upsert: 같은 (교인·조직·연도) 재배정 → 행 추가 없이 직책만 갱신
    await assignMembership(a, {
      memberId,
      departmentId: cell.departmentId,
      periodYear: 2026,
      orgRoleId: memberRole.orgRoleId,
    });
    const m2026 = await listMemberships(a, { periodYear: 2026 });
    expect(m2026).toHaveLength(2); // 여전히 2건
    const cellRow = m2026.find((m) => m.departmentId === cell.departmentId)!;
    expect(cellRow.orgRoleLabel).toBe("부원"); // leader → member 로 갱신됨

    // 리더 식별: 2026 속장으로 되돌리고 listLeaders 검증 (보고서 타게팅 근거)
    await assignMembership(a, {
      memberId,
      departmentId: cell.departmentId,
      periodYear: 2026,
      orgRoleId: leaderRole.orgRoleId,
    });
    const leaders2026 = await listLeaders(a, 2026);
    expect(leaders2026).toHaveLength(1);
    expect(leaders2026[0]!.memberName).toBe("김속장");
    // class_leader 코드로 좁히기
    expect(await listLeaders(a, 2026, { orgRoleCode: "class_leader" })).toHaveLength(1);
    expect(await listLeaders(a, 2026, { orgRoleCode: "department_head" })).toHaveLength(0);
    // 다른 연도엔 리더 없음
    expect(await listLeaders(a, 2025)).toHaveLength(0);

    // 격리: b 에서는 a 의 편성이 보이지 않음
    expect(await listMemberships(b, { periodYear: 2026 })).toHaveLength(0);
    expect(await listLeaders(b, 2026)).toHaveLength(0);

    // 삭제
    await removeMembership(a, cellRow.membershipId);
    expect(await listMemberships(a, { periodYear: 2026 })).toHaveLength(1);
  });
});
