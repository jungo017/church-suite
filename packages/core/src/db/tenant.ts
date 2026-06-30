import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * 테넌트 스코프 DB 접근 (스펙 §5, §17, AGENTS.md §4).
 *
 * RLS 가 ENABLE+FORCE 되어 있으므로(0002_rls_policies),
 * 모든 테넌트 데이터 접근은 트랜잭션 안에서 세션 변수를 설정한 뒤 수행해야 한다.
 * 래퍼를 거치지 않은 기본 `db` 직접 접근은 app.church_id 미설정 → 0행/INSERT 차단(안전망).
 *
 * - set_config(name, value, is_local=true) = SET LOCAL → 트랜잭션 종료 시 자동 해제.
 *   커넥션 풀에서 다른 요청으로 값이 새지 않는다.
 * - 값은 바인드 파라미터로 전달(인젝션 안전).
 */

// db.transaction 콜백이 받는 트랜잭션 핸들 타입.
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 특정 교회로 스코프된 트랜잭션을 실행한다.
 * RLS 정책에 의해 해당 church_id 의 행만 읽고/쓸 수 있다.
 */
export async function withTenant<T>(
  churchId: string,
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(churchId)) {
    throw new Error(`withTenant: 유효하지 않은 churchId: ${churchId}`);
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.church_id', ${churchId}, true)`);
    return fn(tx);
  });
}

/**
 * RLS 를 우회하는 시스템 트랜잭션 (⚠️ 권한 주의).
 *
 * 사용처는 명시적 시스템 컨텍스트로 한정한다:
 *   - 호스트 → church_id 테넌트 해석(0.4, 교차 테넌트 조회)
 *   - 플랫폼 관리/유지보수 작업
 *
 * 온보딩(새 교회 생성)은 보통 새 church_id 를 미리 생성해 withTenant 로 처리하는 것을
 * 우선한다(최소 권한). 부득이한 교차 테넌트 작업에만 withSystem 을 쓴다.
 */
export async function withSystem<T>(
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.bypass_rls', 'on', true)`);
    return fn(tx);
  });
}
