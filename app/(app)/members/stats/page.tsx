import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { memberStats, attendanceTrend, type Bucket } from "@/lib/members/stats";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  MEMBER_STATUS_LABELS,
  GENDER_LABELS,
  SERVICE_TYPE_LABELS,
  type MemberStatus,
  type Gender,
  type ServiceType,
} from "@/lib/members/constants";

function BucketList({
  title,
  buckets,
  label,
}: {
  title: string;
  buckets: Bucket[];
  label: (key: string | null) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-semibold">{title}</h2>
      {buckets.length === 0 ? (
        <EmptyState title="데이터가 없습니다" />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {buckets.map((b, i) => (
            <li
              key={i}
              className="flex justify-between border-b border-border py-1"
            >
              <span>{label(b.key)}</span>
              <span className="font-medium tabular-nums">{b.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function MemberStatsPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_READ);
  const [stats, trend] = await Promise.all([
    memberStats(user.church_id),
    attendanceTrend(user.church_id),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <PageHeader>
        <div>
          <PageTitle>교적 통계</PageTitle>
          <PageDescription>전체 교인 {stats.total}명</PageDescription>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <BucketList
          title="상태별"
          buckets={stats.byStatus}
          label={(k) => MEMBER_STATUS_LABELS[k as MemberStatus] ?? k ?? "미상"}
        />
        <BucketList
          title="성별"
          buckets={stats.byGender}
          label={(k) => (k ? (GENDER_LABELS[k as Gender] ?? k) : "미상")}
        />
        <BucketList
          title="직분별"
          buckets={stats.byPosition}
          label={(k) => k ?? "미지정"}
        />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">최근 출석 추이</h2>
        {trend.length === 0 ? (
          <EmptyState title="출석 데이터가 없습니다" />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {trend.map((t, i) => (
              <li
                key={i}
                className="flex justify-between border-b border-border py-1"
              >
                <span>
                  {t.date} ·{" "}
                  {SERVICE_TYPE_LABELS[t.serviceType as ServiceType] ??
                    t.serviceType}
                </span>
                <span className="font-medium tabular-nums">{t.present}명</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
