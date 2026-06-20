# jobs

백그라운드 잡 워커 (스펙 §11).

**이후 Phase 에서 구현:** pg-boss 또는 Graphile Worker (Postgres 기반, 초기 Redis 불필요).
웹 인스턴스와 분리된 워커 프로세스로 실행.
잡 목록: 재정 마감, 기부금영수증 발행, 알림톡/SMS, 월 정산, 사용량 정합성, 쿼터 임박 알림.
