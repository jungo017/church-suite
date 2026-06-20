import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 테넌트 해석 프록시 (스펙 §5, §13).
 *
 * Next 16에서 `middleware` 규칙이 `proxy`로 대체되었습니다(스펙 §1 결정 로그 참조).
 * 역할/구현은 스펙의 "테넌트 미들웨어"(작업 0.4)와 동일합니다.
 *
 * ⚠️ Phase 0.4 에서 본격 구현 예정:
 *   - 요청 호스트(서브도메인 `교회.도메인` 또는 커스텀 도메인) → church_id 해석
 *   - 미등록 도메인 처리(거부/안내)
 *   - 요청 컨텍스트/세션 변수로 church_id 전파
 *   - 인증 검사(Phase 0.5 JWT 와 연동)
 *
 * 현재는 구조용 pass-through 입니다.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // 정적 자산·내부 경로 제외하고 모든 요청에 적용 (0.4 에서 세분화).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
