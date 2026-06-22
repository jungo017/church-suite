import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, type SQL } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import {
  position,
  orgRole,
  orgMembership,
  member,
  department,
} from "@/lib/db/schema";
import { DEFAULT_POSITIONS, DEFAULT_ORG_ROLES } from "./org-constants";

/**
 * 조직/직분 서비스 (PRE-1·PRE-3, module-survey-report.md §5.1). 테넌트 스코프.
 * - 직분(position)·직책(org_role): 교회 확장 가능한 마스터(시드 + 추가/수정/비활성).
 * - 연도별 편성(org_membership): 매년 개편·다중 소속·이력. 리더 식별로 보고서 타게팅.
 */

// 교회가 라벨만 입력해도 안정적 키를 갖도록 자동 코드 생성.
function genCode(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

// ───────────────────────── 직분 마스터 (position) ─────────────────────────

/** 기본 직분 시드(중복 무시). 온보딩/재시드용 — 멱등. */
export async function seedDefaultPositions(churchId: string): Promise<void> {
  await withTenant(churchId, async (tx) => {
    for (const p of DEFAULT_POSITIONS) {
      await tx
        .insert(position)
        .values({ churchId, code: p.code, label: p.label, sort: p.sort })
        .onConflictDoNothing();
    }
  });
}

export async function listPositions(
  churchId: string,
  opts: { includeInactive?: boolean } = {},
) {
  return withTenant(churchId, (tx) => {
    const conds: SQL[] = [eq(position.churchId, churchId)];
    if (!opts.includeInactive) conds.push(eq(position.active, true));
    return tx
      .select()
      .from(position)
      .where(and(...conds))
      .orderBy(asc(position.sort), asc(position.label));
  });
}

export async function createPosition(
  churchId: string,
  input: { label: string; code?: string; sort?: number },
): Promise<{ positionId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(position)
      .values({
        churchId,
        code: input.code?.trim() || genCode("pos"),
        label: input.label,
        sort: input.sort ?? 100,
      })
      .returning({ positionId: position.positionId });
    return { positionId: rows[0]!.positionId };
  });
}

export async function updatePosition(
  churchId: string,
  positionId: string,
  patch: { label?: string; sort?: number; active?: boolean },
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(position)
      .set(patch)
      .where(
        and(
          eq(position.churchId, churchId),
          eq(position.positionId, positionId),
        ),
      ),
  );
}

// ──────────────────────── 직책 마스터 (org_role) ────────────────────────

/** 기본 직책 시드(중복 무시). 온보딩/재시드용 — 멱등. */
export async function seedDefaultOrgRoles(churchId: string): Promise<void> {
  await withTenant(churchId, async (tx) => {
    for (const r of DEFAULT_ORG_ROLES) {
      await tx
        .insert(orgRole)
        .values({
          churchId,
          code: r.code,
          label: r.label,
          isLeader: r.isLeader,
          sort: r.sort,
        })
        .onConflictDoNothing();
    }
  });
}

export async function listOrgRoles(
  churchId: string,
  opts: { includeInactive?: boolean } = {},
) {
  return withTenant(churchId, (tx) => {
    const conds: SQL[] = [eq(orgRole.churchId, churchId)];
    if (!opts.includeInactive) conds.push(eq(orgRole.active, true));
    return tx
      .select()
      .from(orgRole)
      .where(and(...conds))
      .orderBy(asc(orgRole.sort), asc(orgRole.label));
  });
}

export async function createOrgRole(
  churchId: string,
  input: { label: string; isLeader?: boolean; code?: string; sort?: number },
): Promise<{ orgRoleId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(orgRole)
      .values({
        churchId,
        code: input.code?.trim() || genCode("role"),
        label: input.label,
        isLeader: input.isLeader ?? false,
        sort: input.sort ?? 100,
      })
      .returning({ orgRoleId: orgRole.orgRoleId });
    return { orgRoleId: rows[0]!.orgRoleId };
  });
}

export async function updateOrgRole(
  churchId: string,
  orgRoleId: string,
  patch: { label?: string; isLeader?: boolean; sort?: number; active?: boolean },
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(orgRole)
      .set(patch)
      .where(
        and(eq(orgRole.churchId, churchId), eq(orgRole.orgRoleId, orgRoleId)),
      ),
  );
}

// ───────────────────── 연도별 조직 편성 (org_membership) ─────────────────────

export type MembershipRow = {
  membershipId: string;
  memberId: string;
  memberName: string;
  departmentId: string;
  departmentName: string;
  orgRoleId: string | null;
  orgRoleLabel: string | null;
  isLeader: boolean | null;
  periodYear: number;
  status: string;
};

/** 편성 목록 — 연도/조직/교인 필터. 조인으로 표시용 이름·직책 함께 조회. */
export async function listMemberships(
  churchId: string,
  filter: { periodYear?: number; departmentId?: string; memberId?: string } = {},
): Promise<MembershipRow[]> {
  return withTenant(churchId, (tx) => {
    const conds: SQL[] = [eq(orgMembership.churchId, churchId)];
    if (filter.periodYear != null)
      conds.push(eq(orgMembership.periodYear, filter.periodYear));
    if (filter.departmentId)
      conds.push(eq(orgMembership.departmentId, filter.departmentId));
    if (filter.memberId)
      conds.push(eq(orgMembership.memberId, filter.memberId));
    return tx
      .select({
        membershipId: orgMembership.membershipId,
        memberId: orgMembership.memberId,
        memberName: member.name,
        departmentId: orgMembership.departmentId,
        departmentName: department.name,
        orgRoleId: orgMembership.orgRoleId,
        orgRoleLabel: orgRole.label,
        isLeader: orgRole.isLeader,
        periodYear: orgMembership.periodYear,
        status: orgMembership.status,
      })
      .from(orgMembership)
      .innerJoin(member, eq(orgMembership.memberId, member.memberId))
      .innerJoin(
        department,
        eq(orgMembership.departmentId, department.departmentId),
      )
      .leftJoin(orgRole, eq(orgMembership.orgRoleId, orgRole.orgRoleId))
      .where(and(...conds))
      .orderBy(asc(department.name), asc(member.name));
  });
}

/** 편성(배정). 같은 (교인·조직·연도)면 직책/상태만 갱신(upsert) — 다중 소속은 조직이 다르면 별 레코드. */
export async function assignMembership(
  churchId: string,
  input: {
    memberId: string;
    departmentId: string;
    periodYear: number;
    orgRoleId?: string | null;
    status?: string;
  },
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .insert(orgMembership)
      .values({
        churchId,
        memberId: input.memberId,
        departmentId: input.departmentId,
        periodYear: input.periodYear,
        orgRoleId: input.orgRoleId ?? null,
        status: input.status ?? "active",
      })
      .onConflictDoUpdate({
        target: [
          orgMembership.churchId,
          orgMembership.memberId,
          orgMembership.departmentId,
          orgMembership.periodYear,
        ],
        set: {
          orgRoleId: input.orgRoleId ?? null,
          status: input.status ?? "active",
        },
      }),
  );
}

export async function removeMembership(
  churchId: string,
  membershipId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(orgMembership)
      .where(
        and(
          eq(orgMembership.churchId, churchId),
          eq(orgMembership.membershipId, membershipId),
        ),
      ),
  );
}

/**
 * 그 해 리더(속장/부장 등 is_leader 직책 보유자) 목록.
 * 역할 기반 보고서(S.4)의 자동 배정 대상 선정의 근거가 되는 핵심 쿼리.
 * `orgRoleCode` 를 주면 특정 직책(예: class_leader)만 좁힌다.
 */
export async function listLeaders(
  churchId: string,
  periodYear: number,
  opts: { orgRoleCode?: string } = {},
): Promise<
  {
    memberId: string;
    memberName: string;
    departmentId: string;
    departmentName: string;
    orgRoleId: string;
    orgRoleLabel: string;
  }[]
> {
  return withTenant(churchId, (tx) => {
    const conds: SQL[] = [
      eq(orgMembership.churchId, churchId),
      eq(orgMembership.periodYear, periodYear),
      eq(orgMembership.status, "active"),
      eq(orgRole.isLeader, true),
    ];
    if (opts.orgRoleCode) conds.push(eq(orgRole.code, opts.orgRoleCode));
    return tx
      .select({
        memberId: orgMembership.memberId,
        memberName: member.name,
        departmentId: orgMembership.departmentId,
        departmentName: department.name,
        orgRoleId: orgRole.orgRoleId,
        orgRoleLabel: orgRole.label,
      })
      .from(orgMembership)
      .innerJoin(orgRole, eq(orgMembership.orgRoleId, orgRole.orgRoleId))
      .innerJoin(member, eq(orgMembership.memberId, member.memberId))
      .innerJoin(
        department,
        eq(orgMembership.departmentId, department.departmentId),
      )
      .where(and(...conds))
      .orderBy(asc(department.name), asc(member.name));
  });
}
