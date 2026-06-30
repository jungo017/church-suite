import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
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
        ※ 발송은 큐에 적재되어 워커(<code className="rounded bg-muted px-1">npm run worker</code>)가 채널 프로바이더로 송출합니다.
        기본 드라이버는 mock(log)이며, 실제 SMS/알림톡은 <code className="rounded bg-muted px-1">NOTIFY_DRIVER</code> 채널 연동 후 동작합니다(§14).
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
                <span className="text-muted-foreground">
                  {n.status === "queued" ? "대기" : n.status === "sent" ? "발송" : n.status === "failed" ? "실패" : n.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
