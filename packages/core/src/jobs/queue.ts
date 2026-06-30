import { PgBoss } from "pg-boss";

/**
 * 백그라운드 잡 큐 (스펙 §11, pg-boss · Postgres 기반, 초기 Redis 불필요).
 * 워커(jobs/worker.ts)는 `tsx --conditions=react-server` 로 실행해 `server-only`(코드의
 * client-bundle 가드)를 no-op 으로 만든다 — 그래서 worker 가 server-only 모듈
 * (notify/service·forms/remind 등)을 import 해도 동작한다. 이 파일은 가드 불필요.
 * 스키마 생성 권한이 필요하므로 DATABASE_URL(슈퍼유저)을 사용한다.
 */
export const JOBS = {
  NOTIFY_SEND: "notify.send", // SMS/알림톡 실송출(§14 채널 연동)
  RECEIPTS_ISSUE: "receipts.issue", // 기부금영수증 일괄 발행
  STORAGE_RECONCILE: "storage.reconcile", // 사용량 ↔ 실제 저장량 정합성
  FORMS_REMIND: "forms.remind", // 설문·보고 미제출 독려(S.6)
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  const b = new PgBoss(url);
  await b.start();
  boss = b;
  return b;
}

/** 잡 적재(웹 인스턴스에서 호출). 큐가 없으면 생성. */
export async function sendJob(name: JobName, data: object): Promise<void> {
  const b = await getBoss();
  await b.createQueue(name);
  await b.send(name, data);
}
