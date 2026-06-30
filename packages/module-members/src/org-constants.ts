// 조직(직분/직책/편성) 도메인 상수 — 순수, 서버/클라이언트 공용.
//
// 직분(position)·직책(org_role)은 시스템 고정 enum 이 아니라 교회 범위 마스터다.
// 아래는 온보딩 시 넣는 "기본 시드"일 뿐, 교회가 이후 추가/수정/비활성할 수 있다.

/** 직분(position) 기본 시드 — 감리교 기준 예시. 교회가 이후 확장. */
export const DEFAULT_POSITIONS: { code: string; label: string; sort: number }[] =
  [
    { code: "pastor", label: "목사", sort: 10 },
    { code: "evangelist", label: "전도사", sort: 20 },
    { code: "elder", label: "장로", sort: 30 },
    { code: "gwonsa", label: "권사", sort: 40 },
    { code: "ansu_deacon", label: "안수집사", sort: 50 },
    { code: "deacon", label: "집사", sort: 60 },
    { code: "saint", label: "성도", sort: 70 },
  ];

/** 조직 직책(org_role) 기본 시드 — is_leader=리더(일괄 타게팅 근거). 교회가 이후 확장. */
export const DEFAULT_ORG_ROLES: {
  code: string;
  label: string;
  isLeader: boolean;
  sort: number;
}[] = [
  { code: "department_head", label: "부장", isLeader: true, sort: 10 },
  { code: "class_leader", label: "속장", isLeader: true, sort: 20 },
  { code: "secretary", label: "총무", isLeader: false, sort: 30 },
  { code: "treasurer", label: "회계", isLeader: false, sort: 40 },
  { code: "member", label: "부원", isLeader: false, sort: 50 },
  { code: "class_member", label: "속원", isLeader: false, sort: 60 },
];

/** 조직 편성(org_membership) 상태. */
export const MEMBERSHIP_STATUSES = ["active", "ended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "활동",
  ended: "종료",
};
export function isMembershipStatus(v: string): v is MembershipStatus {
  return (MEMBERSHIP_STATUSES as readonly string[]).includes(v);
}
