"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { sendJob, JOBS } from "@church/core/jobs/queue";
import { queueToActiveMembers, isChannel } from "./service";

/**
 * 활성 교인 일괄 발송. 큐 적재 후 NOTIFY_SEND 잡으로 워커가 채널 송출(§14).
 * (웹 요청은 외부 채널 호출을 기다리지 않음 — 무상태/응답성)
 */
export async function sendNotificationAction(fd: FormData) {
  const res = await checkPermission(PERMISSIONS.MEMBERS_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");

  const message = String(fd.get("message") ?? "").trim();
  const channelRaw = String(fd.get("channel") ?? "sms");
  if (!message) throw new Error("message_required");
  const channel = isChannel(channelRaw) ? channelRaw : "sms";

  const ids = await queueToActiveMembers(res.user.church_id, { channel, message });
  if (ids.length > 0) {
    await sendJob(JOBS.NOTIFY_SEND, {
      churchId: res.user.church_id,
      notificationIds: ids,
    });
  }
  revalidatePath("/members/notify");
}
