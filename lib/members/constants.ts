// 교인 도메인 상수 (순수, 서버/클라이언트 공용).

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABELS: Record<Gender, string> = {
  male: "남",
  female: "여",
};

export const MEMBER_STATUSES = [
  "active",
  "inactive",
  "transferred",
  "deceased",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "재적",
  inactive: "비활동",
  transferred: "이전",
  deceased: "소천",
};

export const SERVICE_TYPES = [
  "sunday",
  "dawn",
  "wednesday",
  "friday",
  "etc",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  sunday: "주일예배",
  dawn: "새벽예배",
  wednesday: "수요예배",
  friday: "금요예배",
  etc: "기타",
};
export function isServiceType(v: string): v is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(v);
}

export function isGender(v: string): v is Gender {
  return (GENDERS as readonly string[]).includes(v);
}
export function isMemberStatus(v: string): v is MemberStatus {
  return (MEMBER_STATUSES as readonly string[]).includes(v);
}
