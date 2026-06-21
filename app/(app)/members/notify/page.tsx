import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listNotifications, CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/notify/service";
import { sendNotificationAction } from "@/lib/notify/actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function NotifyPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const logs = await listNotifications(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">문자/알림 발송</h1>
      <p className="text-xs text-muted-foreground">
        ※ 실제 SMS/알림톡 송출은 외부 채널 연동 후 제공됩니다. 현재는 발송 로그(mock)만 생성됩니다.
      </p>

      <form action={sendNotificationAction} className="flex flex-col gap-2">
        <select name="channel" defaultValue="sms" className={input}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
          ))}
        </select>
        <textarea name="message" rows={3} required placeholder="메시지 내용" className={input} />
        <button className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          활성 교인에게 발송
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">발송 로그</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">발송 내역이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {logs.map((n) => (
              <li key={n.notificationId} className="flex justify-between border-b border-border py-1.5">
                <span>
                  [{CHANNEL_LABELS[n.channel as Channel] ?? n.channel}] {n.recipientName ?? n.recipient} · {n.message.slice(0, 20)}
                </span>
                <span className="text-muted-foreground">{n.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
