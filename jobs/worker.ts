import "dotenv/config";
import { getBoss, JOBS } from "@church/core/jobs/queue";
import { remindPending } from "@/lib/forms/remind";
import { processNotifications } from "@church/core/notify/service";

/**
 * 백그라운드 잡 워커 (스펙 §11). 웹 인스턴스와 분리된 프로세스로 실행.
 *   npm run worker
 *
 * 핸들러는 현재 로그만 남기는 스캐폴드다. 실제 처리(알림톡/SMS 송출, 영수증 일괄발행,
 * 사용량 정합성)는 각 도메인 서비스와 외부 채널(§14)을 연결해 채운다.
 */
async function main() {
  const boss = await getBoss();
  for (const name of Object.values(JOBS)) {
    await boss.createQueue(name);
  }

  await boss.work<{ churchId: string; notificationIds: string[] }>(
    JOBS.NOTIFY_SEND,
    async (jobs) => {
      for (const job of jobs) {
        const { churchId, notificationIds } = job.data;
        const r = await processNotifications(churchId, notificationIds ?? []);
        console.log("[notify.send]", { churchId, ...r });
      }
    },
  );
  await boss.work<Record<string, unknown>>(JOBS.RECEIPTS_ISSUE, async (jobs) => {
    for (const job of jobs) console.log("[receipts.issue]", job.data);
    // TODO: 기간/교회별 기부금영수증 일괄 생성
  });
  await boss.work<Record<string, unknown>>(
    JOBS.STORAGE_RECONCILE,
    async (jobs) => {
      for (const job of jobs) console.log("[storage.reconcile]", job.data);
      // TODO: church_storage_usage ↔ 실제 저장량 대조 보정
    },
  );
  await boss.work<{ churchId: string; formId: string; message?: string }>(
    JOBS.FORMS_REMIND,
    async (jobs) => {
      for (const job of jobs) {
        const { churchId, formId, message } = job.data;
        const r = await remindPending(churchId, formId, { message });
        console.log("[forms.remind]", { formId, ...r });
      }
    },
  );

  console.log("worker started; queues:", Object.values(JOBS).join(", "));
}

main().catch((err) => {
  console.error("worker failed:", err);
  process.exit(1);
});
