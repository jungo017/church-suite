import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { member, voucher, account } from "@church/core/db/schema";
import { createUser } from "@church/core/auth/users";
import { assignRole } from "@church/core/rbac/seed";
import { ROLES } from "@church/core/rbac/roles";

/**
 * 교인 셀프 포털(온라인교인센터) 서비스 (스펙 §7.4).
 * 본인 데이터만 노출 — 앱 레벨에서 보장(로그인 사용자의 연결 member_id 기준).
 */

/** 본인 헌금내역(수입 전표 중 본인 member_id). */
export async function listMyGiving(churchId: string, memberId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        voucherDate: voucher.voucherDate,
        amount: voucher.amount,
        accountName: account.name,
      })
      .from(voucher)
      .leftJoin(account, eq(voucher.accountId, account.accountId))
      .where(
        and(
          eq(voucher.churchId, churchId),
          eq(voucher.memberId, memberId),
          eq(voucher.type, "income"),
        ),
      )
      .orderBy(desc(voucher.voucherDate)),
  );
}

/** 교인 계정 발급: app_user 생성(member_id 연결) + member 역할 부여. */
export async function createMemberUser(
  churchId: string,
  memberId: string,
  loginId: string,
  password: string,
): Promise<{ userId: string }> {
  const m = await withTenant(churchId, (tx) =>
    tx
      .select({ name: member.name })
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId)))
      .limit(1),
  );
  if (!m[0]) throw new Error("member_not_found");

  const { userId } = await createUser({
    churchId,
    loginId,
    password,
    name: m[0].name,
    memberId,
  });
  await assignRole(churchId, userId, ROLES.MEMBER);
  return { userId };
}
