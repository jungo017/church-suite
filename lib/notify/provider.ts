import "server-only";
import { randomUUID } from "node:crypto";

/**
 * 알림 채널 프로바이더 추상화 (스펙 §14). 실제 SMS/알림톡 송출의 단일 연결점.
 * 앱은 이 인터페이스로만 송출 — 백엔드(알리고/NCP SENS/Solapi 등) 교체 자유.
 *
 * NOTIFY_DRIVER 로 선택(기본 'log'=mock). 실채널 드라이버는 자격증명 연동 시
 * lib/notify/providers/<driver>.ts 를 추가해 연결한다(스토리지 s3 어댑터와 동일 방식).
 */
export type NotifyMessage = { channel: string; to: string; message: string };
export type NotifyResult = { ok: boolean; providerRef?: string; error?: string };

export interface NotifyProvider {
  send(msg: NotifyMessage): Promise<NotifyResult>;
}

/** 개발/기본 프로바이더 — 실제 송출 없이 로그만(성공 처리). 빈 수신자는 실패. */
class LogProvider implements NotifyProvider {
  async send(msg: NotifyMessage): Promise<NotifyResult> {
    if (!msg.to) return { ok: false, error: "no_recipient" };
    console.log(`[notify:log] ${msg.channel} → ${msg.to}: ${msg.message}`);
    return { ok: true, providerRef: `log-${randomUUID()}` };
  }
}

let cached: NotifyProvider | null = null;

export function getNotifyProvider(): NotifyProvider {
  if (cached) return cached;
  const driver = process.env.NOTIFY_DRIVER ?? "log";
  if (driver !== "log") {
    // 실채널(alimtalk/sms) 연동 시 여기서 해당 드라이버를 생성한다.
    throw new Error(
      `NOTIFY_DRIVER=${driver} 프로바이더가 아직 구성되지 않았습니다. lib/notify/providers/${driver}.ts 연동 필요(§14).`,
    );
  }
  cached = new LogProvider();
  return cached;
}
