import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/rbac/roles";
import { AppShell, type NavModule } from "./app-shell";

// 인증 영역 레이아웃 (스펙 §13: app/(app)). SSR.
// 정보구조: 상위=시스템(교적/재정/비품/홈페이지), 하위=각 시스템 기능.
// 각 시스템은 자기 사이드바를 가진 독립 작업공간으로 동작.
type ModuleDef = {
  key: string;
  label: string;
  href: string;
  basePath: string;
  perm: Permission;
  sub: { href: string; label: string; exact?: boolean; perm?: Permission }[];
};

const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "대시보드",
    href: "/dashboard",
    basePath: "/dashboard",
    perm: PERMISSIONS.MEMBERS_READ,
    sub: [],
  },
  {
    key: "members",
    label: "교적",
    href: "/members",
    basePath: "/members",
    perm: PERMISSIONS.MEMBERS_READ,
    sub: [
      { href: "/members", label: "교인 명단", exact: true },
      { href: "/members/stats", label: "통계" },
      { href: "/members/attendance", label: "출석", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/kiosk", label: "키오스크", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/labels", label: "QR 라벨", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/education", label: "교육", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/families", label: "가족 관리", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/notify", label: "문자/알림", perm: PERMISSIONS.MEMBERS_WRITE },
      { href: "/members/compliance", label: "컴플라이언스", perm: PERMISSIONS.CHURCH_MANAGE },
      { href: "/members/new", label: "+ 교인 등록", perm: PERMISSIONS.MEMBERS_WRITE },
    ],
  },
  {
    key: "finance",
    label: "재정",
    href: "/finance",
    basePath: "/finance",
    perm: PERMISSIONS.FINANCE_READ,
    sub: [
      { href: "/finance", label: "전표", exact: true },
      { href: "/finance/accounts", label: "계정과목" },
      { href: "/finance/report", label: "보고서(예결산)" },
      { href: "/finance/receipts", label: "기부금영수증" },
      { href: "/finance/new", label: "+ 전표 등록", perm: PERMISSIONS.FINANCE_WRITE },
    ],
  },
  {
    key: "assets",
    label: "비품",
    href: "/assets",
    basePath: "/assets",
    perm: PERMISSIONS.ASSETS_READ,
    sub: [
      { href: "/assets", label: "자산 목록", exact: true },
      { href: "/assets/classification", label: "분류 관리", perm: PERMISSIONS.ASSETS_WRITE },
      { href: "/assets/audits", label: "전수조사", perm: PERMISSIONS.ASSETS_WRITE },
      { href: "/assets/labels", label: "QR 라벨" },
      { href: "/assets/new", label: "+ 자산 등록", perm: PERMISSIONS.ASSETS_WRITE },
    ],
  },
  {
    key: "site",
    label: "홈페이지",
    href: "/site",
    basePath: "/site",
    perm: PERMISSIONS.SITE_WRITE,
    sub: [
      { href: "/site", label: "개요", exact: true },
      { href: "/site/new-family", label: "새가족 신청" },
      { href: "/site/offerings", label: "온라인 헌금" },
    ],
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const modules: NavModule[] = MODULES.filter((m) =>
    hasPermission(user.roles, m.perm),
  ).map((m) => ({
    key: m.key,
    label: m.label,
    href: m.href,
    basePath: m.basePath,
    sub: m.sub
      .filter((s) => !s.perm || hasPermission(user.roles, s.perm))
      .map(({ href, label, exact }) => ({ href, label, exact })),
  }));

  const personal: NavModule = {
    key: "personal",
    label: "내 정보",
    href: "/my",
    basePath: "/my",
    sub: [
      { href: "/my", label: "내 정보", exact: true },
      { href: "/my/giving", label: "나의 헌금내역" },
    ],
  };

  return (
    <AppShell modules={modules} personal={personal} userName={user.name}>
      {children}
    </AppShell>
  );
}
