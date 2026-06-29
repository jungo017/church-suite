// 모듈 레지스트리/가시성 단위 테스트 (스펙 §1 P-1) — DB 불필요(순수 함수).
import { describe, it, expect, beforeEach } from "vitest";
import { PERMISSIONS, hasPermission, type Permission } from "@/lib/rbac/roles";
import type { ModuleManifest, ModuleKey } from "@church/core";
import {
  visibleModules,
  registerModule,
  allModules,
  getModule,
  resetRegistry,
} from "@church/core";
import { assetsManifest } from "@/lib/assets/manifest";

// 테스트용 최소 finance 매니페스트(파일럿 외 모듈 — 필터 검증용).
const financeManifest: ModuleManifest = {
  key: "finance",
  title: "재정",
  basePath: "/finance",
  href: "/finance",
  permission: PERMISSIONS.FINANCE_READ,
  nav: [
    { href: "/finance", label: "전표", exact: true },
    { href: "/finance/new", label: "+ 전표 등록", perm: PERMISSIONS.FINANCE_WRITE },
  ],
  ownedSchema: "finance",
  migrations: "drizzle",
  requiresCore: "^0.1.0",
};

const ALL = [assetsManifest, financeManifest];
const set = (...keys: ModuleKey[]) => new Set<ModuleKey>(keys);
// 권한 판정자 주입(DI) — 실제 RBAC(hasPermission)로 구성.
const can = (...roles: string[]) => (perm: string) => hasPermission(roles, perm as Permission);

describe("visibleModules — 전체 ∩ installed ∩ RBAC", () => {
  it("엔타이틀먼트로 설치되지 않은 모듈은 제외", () => {
    const out = visibleModules(ALL, set("assets"), can("admin"));
    expect(out.map((m) => m.key)).toEqual(["assets"]);
  });

  it("설치 0개면 빈 배열", () => {
    expect(visibleModules(ALL, set(), can("admin"))).toEqual([]);
  });

  it("모듈 진입 권한이 없으면 제외 (member 역할 = 권한 없음)", () => {
    expect(visibleModules(ALL, set("assets", "finance"), can("member"))).toEqual([]);
  });

  it("viewer 는 읽기 권한 모듈만 보이고, 쓰기 네비는 숨김", () => {
    const out = visibleModules(ALL, set("assets", "finance"), can("viewer"));
    expect(out.map((m) => m.key).sort()).toEqual(["assets", "finance"]);

    const assets = out.find((m) => m.key === "assets")!;
    // 쓰기(perm: ASSETS_WRITE) 항목 제거 → perm 없는 항목만 남음
    expect(assets.nav.map((n) => n.label)).toEqual(["자산 목록", "QR 라벨"]);

    const finance = out.find((m) => m.key === "finance")!;
    expect(finance.nav.map((n) => n.label)).toEqual(["전표"]); // "+ 전표 등록" 숨김
  });

  it("admin 은 모든 네비를 본다", () => {
    const out = visibleModules(ALL, set("assets"), can("admin"));
    expect(out[0].nav).toHaveLength(assetsManifest.nav.length);
  });

  it("원본 매니페스트를 변형하지 않는다(불변)", () => {
    const before = assetsManifest.nav.length;
    visibleModules(ALL, set("assets"), can("viewer"));
    expect(assetsManifest.nav.length).toBe(before);
  });
});

describe("registry — 명시 등록 / 중복 거부", () => {
  beforeEach(() => resetRegistry());

  it("등록 후 조회", () => {
    registerModule(assetsManifest);
    expect(getModule("assets")).toBe(assetsManifest);
    expect(allModules().map((m) => m.key)).toEqual(["assets"]);
  });

  it("같은 키 중복 등록은 throw", () => {
    registerModule(assetsManifest);
    expect(() => registerModule(assetsManifest)).toThrow(/already registered/);
  });
});
