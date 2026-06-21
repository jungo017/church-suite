"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { sendToActiveMembers, isChannel } from "./service";

export async function sendNotificationAction(fd: FormData) {
  const res = await checkPermission(PERMISSIONS.MEMBERS_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");

  const message = String(fd.get("message") ?? "").trim();
  const channelRaw = String(fd.get("channel") ?? "sms");
  if (!message) throw new Error("message_required");
  const channel = isChannel(channelRaw) ? channelRaw : "sms";

  await sendToActiveMembers(res.user.church_id, { channel, message });
  revalidatePath("/members/notify");
}
