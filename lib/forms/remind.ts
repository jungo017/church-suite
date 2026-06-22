import "server-only";
import { sendToMembers, type Channel } from "@/lib/notify/service";
import { getForm } from "./service";
import { listPendingMemberIds } from "./assignments";

/**
 * 미제출 독려 (S.6, module-survey-report.md §4.2·§10).
 * 폼의 미제출(pending) 배정자에게 알림 발송 — lib/notify 재사용(mock).
 * 백그라운드 잡(JOBS.FORMS_REMIND)의 워커 핸들러가 이 함수를 호출한다.
 */
export async function remindPending(
  churchId: string,
  formId: string,
  opts: { channel?: Channel; message?: string } = {},
): Promise<{ pending: number; sent: number }> {
  const f = await getForm(churchId, formId);
  if (!f) return { pending: 0, sent: 0 };

  const memberIds = await listPendingMemberIds(churchId, formId);
  if (memberIds.length === 0) return { pending: 0, sent: 0 };

  const message =
    opts.message?.trim() ||
    `[${f.title}] 아직 제출하지 않으셨습니다. 제출 부탁드립니다.`;
  const { sent } = await sendToMembers(churchId, {
    memberIds,
    channel: opts.channel ?? "alimtalk",
    message,
  });
  return { pending: memberIds.length, sent };
}
