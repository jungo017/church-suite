import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { newfamilyReq, member } from "@church/core/db/schema";

/** 새가족 등록 접수 (스펙 §7.4). 공개 제출 + 어드민 검토→교인 전환. */

export type NewFamilyInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  message?: string | null;
};

/** 공개 제출(인증 불필요, 호스트로 해석한 churchId). */
export async function submitNewFamily(
  churchId: string,
  input: NewFamilyInput,
): Promise<{ reqId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(newfamilyReq)
      .values({
        churchId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        message: input.message ?? null,
      })
      .returning({ reqId: newfamilyReq.reqId });
    return { reqId: rows[0]!.reqId };
  });
}

export async function listNewFamilyReqs(churchId: string, status?: string) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(newfamilyReq.churchId, churchId)];
    if (status) conds.push(eq(newfamilyReq.status, status));
    return tx
      .select()
      .from(newfamilyReq)
      .where(and(...conds))
      .orderBy(desc(newfamilyReq.createdAt));
  });
}

/** 승인 → 교인(member) 생성 + 상태/연결 갱신(원자적). */
export async function approveNewFamily(
  churchId: string,
  reqId: string,
  registeredDate: string,
): Promise<{ memberId: string } | null> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select()
      .from(newfamilyReq)
      .where(and(eq(newfamilyReq.churchId, churchId), eq(newfamilyReq.reqId, reqId)))
      .limit(1);
    const req = rows[0];
    if (!req || req.status === "approved") return null;

    const memRows = await tx
      .insert(member)
      .values({
        churchId,
        name: req.name,
        phone: req.phone,
        email: req.email,
        address: req.address,
        status: "active",
        registeredDate,
      })
      .returning({ memberId: member.memberId });
    const memberId = memRows[0]!.memberId;

    await tx
      .update(newfamilyReq)
      .set({ status: "approved", memberId })
      .where(and(eq(newfamilyReq.churchId, churchId), eq(newfamilyReq.reqId, reqId)));
    return { memberId };
  });
}

export async function rejectNewFamily(
  churchId: string,
  reqId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(newfamilyReq)
      .set({ status: "rejected" })
      .where(and(eq(newfamilyReq.churchId, churchId), eq(newfamilyReq.reqId, reqId))),
  );
}
