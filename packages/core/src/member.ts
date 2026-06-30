import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { appUser, member, orgMembership, orgRole } from "@church/core/db/schema";

/**
 * 교인 디렉터리 — **코어 공유 읽기**(스펙 §2-3 교인 단일 원본, module-platform.md §5.1·§5.2).
 *
 * `member`·`org_membership`·`org_role`·`app_user` 는 코어 소유 테이블이다. 타 모듈이
 * 이 데이터를 읽어야 하면(예: 설문/보고가 사용자→교인 매핑·직책별 대상자 조회) 모듈을
 * 직접 import 하지 않고 **코어가 노출하는 이 읽기**를 경유한다(모듈→모듈 결합 금지, AGENTS §4.1).
 * 쓰기/관리(직분·편성 CRUD, 셀프포털 계정발급 등)는 교적 모듈이 소유한다.
 */

/** 사용자 계정 → 연결된 교인(없으면 null). 셀프포털·셀프제출이 본인 식별에 사용. */
export async function getUserMember(churchId: string, userId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({
        memberId: member.memberId,
        name: member.name,
        position: member.position,
        phone: member.phone,
        email: member.email,
        registeredDate: member.registeredDate,
      })
      .from(appUser)
      .innerJoin(member, eq(appUser.memberId, member.memberId))
      .where(and(eq(appUser.churchId, churchId), eq(appUser.userId, userId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

/** 해당 연도·직책(orgRole 코드)으로 편성된 활성 교인 목록. 역할기반 보고 배정 대상. */
export async function listMembersByOrgRole(
  churchId: string,
  periodYear: number,
  orgRoleCode: string,
): Promise<{ memberId: string; memberName: string }[]> {
  return withTenant(churchId, (tx) =>
    tx
      .selectDistinct({
        memberId: orgMembership.memberId,
        memberName: member.name,
      })
      .from(orgMembership)
      .innerJoin(orgRole, eq(orgMembership.orgRoleId, orgRole.orgRoleId))
      .innerJoin(member, eq(orgMembership.memberId, member.memberId))
      .where(
        and(
          eq(orgMembership.churchId, churchId),
          eq(orgMembership.periodYear, periodYear),
          eq(orgMembership.status, "active"),
          eq(orgRole.code, orgRoleCode),
        ),
      )
      .orderBy(asc(member.name)),
  );
}
