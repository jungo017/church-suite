import "server-only";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { member, family } from "@/lib/db/schema";
import { toPaged, type Paged } from "@/lib/db/pagination";

/** 교인 CRUD 서비스 (스펙 §7.2). 테넌트 스코프. 교인 데이터는 단일 원본(§2). */

export type MemberInput = {
  name: string;
  gender?: string | null;
  birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  position?: string | null; // 레거시 자유텍스트(신규 입력은 positionId 사용)
  positionId?: string | null; // 직분 마스터 참조(PRE-1)
  departmentId?: string | null;
  familyId?: string | null;
  registeredDate?: string | null;
  status?: string;
};

export type MemberFilters = {
  status?: string;
  departmentId?: string;
  q?: string;
};

export async function listMembers(churchId: string, filters: MemberFilters = {}) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(member.churchId, churchId)];
    if (filters.status) conds.push(eq(member.status, filters.status));
    if (filters.departmentId)
      conds.push(eq(member.departmentId, filters.departmentId));
    if (filters.q) conds.push(ilike(member.name, `%${filters.q}%`));
    return tx
      .select()
      .from(member)
      .where(and(...conds))
      .orderBy(asc(member.name));
  });
}

/** 페이지 단위 교인 목록(대량 데이터). */
export async function listMembersPaged(
  churchId: string,
  filters: MemberFilters,
  page: number,
  pageSize: number,
): Promise<Paged<typeof member.$inferSelect>> {
  return withTenant(churchId, async (tx) => {
    const conds = [eq(member.churchId, churchId)];
    if (filters.status) conds.push(eq(member.status, filters.status));
    if (filters.departmentId)
      conds.push(eq(member.departmentId, filters.departmentId));
    if (filters.q) conds.push(ilike(member.name, `%${filters.q}%`));
    const where = and(...conds);
    const items = await tx
      .select()
      .from(member)
      .where(where)
      .orderBy(asc(member.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const c = await tx.select({ n: count() }).from(member).where(where);
    return toPaged(items, Number(c[0]?.n ?? 0), page, pageSize);
  });
}

export async function getMember(churchId: string, memberId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createMember(
  churchId: string,
  input: MemberInput,
): Promise<{ memberId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(member)
      .values({
        churchId,
        name: input.name,
        gender: input.gender ?? null,
        birth: input.birth ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        position: input.position ?? null,
        positionId: input.positionId ?? null,
        departmentId: input.departmentId ?? null,
        familyId: input.familyId ?? null,
        registeredDate: input.registeredDate ?? null,
        status: input.status ?? "active",
      })
      .returning({ memberId: member.memberId });
    return { memberId: rows[0]!.memberId };
  });
}

const UPDATABLE = [
  "name",
  "gender",
  "birth",
  "phone",
  "email",
  "address",
  "position",
  "positionId",
  "departmentId",
  "familyId",
  "registeredDate",
  "status",
] as const;

export async function updateMember(
  churchId: string,
  memberId: string,
  input: Partial<MemberInput>,
): Promise<void> {
  const set: Record<string, unknown> = {};
  for (const key of UPDATABLE) {
    if (input[key] !== undefined) set[key] = input[key];
  }
  if (Object.keys(set).length === 0) return;
  await withTenant(churchId, (tx) =>
    tx
      .update(member)
      .set(set)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId))),
  );
}

export async function deleteMember(
  churchId: string,
  memberId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(member)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId))),
  );
}

// ── 가족 ──
export async function listFamilies(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(family)
      .where(eq(family.churchId, churchId))
      .orderBy(asc(family.name)),
  );
}

export async function createFamily(
  churchId: string,
  name: string,
): Promise<{ familyId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(family)
      .values({ churchId, name })
      .returning({ familyId: family.familyId });
    return { familyId: rows[0]!.familyId };
  });
}
