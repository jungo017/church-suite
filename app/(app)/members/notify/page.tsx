import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listNotifications, CHANNELS, CHANNEL_LABELS, type Channel } from "@/lib/notify/service";
import { sendNotificationAction } from "@/lib/notify/actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Field, FieldLabel, Select, Textarea } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";

// 발송 상태 → Badge 톤/라벨 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  queued: { tone: "muted", label: "대기" },
  sent: { tone: "success", label: "발송" },
  failed: { tone: "destructive", label: "실패" },
};

export default async function NotifyPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const logs = await listNotifications(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <PageTitle>문자/알림 발송</PageTitle>
        <PageDescription>
          ※ 발송은 큐에 적재되어 워커(<code className="rounded bg-muted px-1">npm run worker</code>)가 채널 프로바이더로 송출합니다.
          기본 드라이버는 mock(log)이며, 실제 SMS/알림톡은 <code className="rounded bg-muted px-1">NOTIFY_DRIVER</code> 채널 연동 후 동작합니다(§14).
        </PageDescription>
      </PageHeader>

      <form action={sendNotificationAction} className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="channel">채널</FieldLabel>
          <Select id="channel" name="channel" defaultValue="sms">
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="message" required>
            메시지 내용
          </FieldLabel>
          <Textarea id="message" name="message" rows={3} required placeholder="메시지 내용" />
        </Field>
        <Button type="submit" className="w-fit">
          <Send />
          활성 교인에게 발송
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">발송 로그</h2>
        {logs.length === 0 ? (
          <EmptyState
            title="발송 내역이 없습니다"
            description="위 양식에서 메시지를 발송하면 송출 결과가 여기에 기록됩니다."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {logs.map((n) => {
              const meta = STATUS_META[n.status] ?? { tone: "muted" as BadgeTone, label: n.status };
              return (
                <li key={n.notificationId} className="flex items-center justify-between gap-2 border-b border-border py-1.5">
                  <span>
                    [{CHANNEL_LABELS[n.channel as Channel] ?? n.channel}] {n.recipientName ?? n.recipient} · {n.message.slice(0, 20)}
                  </span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
