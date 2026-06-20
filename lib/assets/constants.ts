// 자산 도메인 상수 (순수, 서버/클라이언트 공용).

export const ASSET_TYPES = [
  "equipment",
  "land",
  "building",
  "consumable",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  equipment: "비품",
  land: "토지",
  building: "건물",
  consumable: "소모품",
};

export const ASSET_STATUSES = [
  "in_use",
  "in_repair",
  "idle",
  "disposed",
] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  in_use: "사용중",
  in_repair: "수리중",
  idle: "유휴",
  disposed: "폐기",
};

export function isAssetType(v: string): v is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(v);
}
export function isAssetStatus(v: string): v is AssetStatus {
  return (ASSET_STATUSES as readonly string[]).includes(v);
}
