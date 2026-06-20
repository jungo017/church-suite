# lib/storage

파일 저장소 S3 어댑터 (스펙 §10, AGENTS.md §4: 직접 디스크 접근 금지).

**Phase 4 에서 구현:** SeaweedFS(S3 호환) 어댑터. 교회별 프리픽스 `church-{id}/...`,
업로드 직전 쿼터 체크, 사용량 카운터 증감. 백엔드 교체가 자유롭도록 S3 API로 추상화.
