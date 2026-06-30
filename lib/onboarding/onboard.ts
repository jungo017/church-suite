import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { withTenant, withSystem } from "@church/core/db/tenant";
import {
  church,
  appUser,
  role,
  userRole,
  subscription,
  churchStorageUsage,
  plan,
  position,
  orgRole,
} from "@church/core/db/schema";
import { hashPassword } from "@church/core/auth/password";
import { assertUsableLoginId } from "@church/core/auth/login-id";
import { DEFAULT_ROLES, ROLES } from "@church/core/rbac/roles";
import { DEFAULT_POSITIONS, DEFAULT_ORG_ROLES } from "@/lib/members/org-constants";
import { resolveChurchByCode } from "@church/core/tenant/resolve";
import { RESERVED_SUBDOMAINS } from "@church/core/tenant/host";

/**
 * 교회 온보딩 (스펙 §5, 작업 0.8).
 * 새 교회 + 기본 역할 + 관리자 사용자 + 구독 + 사용량 레코드를
 * 단일 테넌트 트랜잭션으로 원자적으로 생성한다.
 */
export class OnboardError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "OnboardError";
  }
}

// 서브도메인으로 쓰일 교회 코드: 소문자/숫자/하이픈, 2~31자.
const CODE_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;
const FREE_PLAN = {
  name: "free",
  storageLimit: 1024 * 1024 * 1024, // 1 GiB
  price: "0",
};

/** 기본 'free' 요금제를 보장하고 planId 반환(전역). */
async function ensureFreePlan(): Promise<string> {
  return withSystem(async (tx) => {
    await tx.insert(plan).values(FREE_PLAN).onConflictDoNothing();
    const rows = await tx
      .select({ planId: plan.planId })
      .from(plan)
      .where(eq(plan.name, "free"))
      .limit(1);
    return rows[0]!.planId;
  });
}

export async function onboardChurch(opts: {
  churchName: string;
  churchCode: string;
  adminLoginId: string;
  adminPassword: string;
  adminName?: string;
}): Promise<{ churchId: string; userId: string; code: string }> {
  const code = opts.churchCode.trim().toLowerCase();
  const name = opts.churchName.trim();
  let loginId: string;

  if (!CODE_RE.test(code)) throw new OnboardError("invalid_code");
  // 예약 서브도메인(인프라/시스템 경로)은 코드로 선점 불가 — 라우팅 하이재킹 방지.
  if (RESERVED_SUBDOMAINS.has(code)) throw new OnboardError("reserved_code");
  if (!name) throw new OnboardError("invalid_name");
  try {
    loginId = assertUsableLoginId(opts.adminLoginId);
  } catch {
    throw new OnboardError("invalid_admin_login");
  }
  if (opts.adminPassword.length < 8) {
    throw new OnboardError("invalid_admin");
  }
  if (await resolveChurchByCode(code)) throw new OnboardError("code_taken");

  const planId = await ensureFreePlan();
  const passwordHash = await hashPassword(opts.adminPassword);
  const churchId = randomUUID();
  const userId = randomUUID();

  try {
    await withTenant(churchId, async (tx) => {
      await tx.insert(church).values({ churchId, code, name });
      await tx.insert(subscription).values({ churchId, planId, status: "active" });
      await tx.insert(churchStorageUsage).values({ churchId });

      // 기본 직분/직책 마스터 시드(PRE-1·PRE-3). 교회가 이후 추가/수정 가능.
      await tx.insert(position).values(
        DEFAULT_POSITIONS.map((p) => ({
          churchId,
          code: p.code,
          label: p.label,
          sort: p.sort,
        })),
      );
      await tx.insert(orgRole).values(
        DEFAULT_ORG_ROLES.map((r) => ({
          churchId,
          code: r.code,
          label: r.label,
          isLeader: r.isLeader,
          sort: r.sort,
        })),
      );

      const roleRows = await tx
        .insert(role)
        .values(DEFAULT_ROLES.map((r) => ({ churchId, name: r.name })))
        .returning({ roleId: role.roleId, name: role.name });
      const adminRoleId = roleRows.find((r) => r.name === ROLES.ADMIN)!.roleId;

      await tx.insert(appUser).values({
        userId,
        churchId,
        loginId,
        passwordHash,
        name: opts.adminName?.trim() || loginId,
      });
      await tx.insert(userRole).values({ churchId, userId, roleId: adminRoleId });
    });
  } catch (e) {
    // 동시 가입으로 코드 유니크 위반(23505) → code_taken 으로 매핑
    if (e && typeof e === "object" && "code" in e && e.code === "23505") {
      throw new OnboardError("code_taken");
    }
    throw e;
  }

  return { churchId, userId, code };
}
