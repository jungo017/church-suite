import "server-only";
import { sql } from "drizzle-orm";
import { withSystem } from "@/lib/db/tenant";

export type PlatformChurchRow = {
  churchId: string;
  name: string;
  code: string;
  status: string;
  users: number;
  members: number;
};

export async function platformSummary(): Promise<{
  churches: number;
  activeChurches: number;
  users: number;
  members: number;
  assets: number;
}> {
  const rows = await withSystem((tx) =>
    tx.execute(sql<{
      churches: string;
      active_churches: string;
      users: string;
      members: string;
      assets: string;
    }>`
      select
        (select count(*) from church) as churches,
        (select count(*) from church where status = 'active') as active_churches,
        (select count(*) from app_user) as users,
        (select count(*) from member) as members,
        (select count(*) from asset) as assets
    `),
  );
  const row = rows[0]!;
  return {
    churches: Number(row.churches),
    activeChurches: Number(row.active_churches),
    users: Number(row.users),
    members: Number(row.members),
    assets: Number(row.assets),
  };
}

export async function listPlatformChurches(): Promise<PlatformChurchRow[]> {
  const rows = await withSystem((tx) =>
    tx.execute(sql<{
      church_id: string;
      name: string;
      code: string;
      status: string;
      users: string;
      members: string;
    }>`
      select
        c.church_id,
        c.name,
        c.code,
        c.status,
        count(distinct u.user_id) as users,
        count(distinct m.member_id) as members
      from church c
      left join app_user u on u.church_id = c.church_id
      left join member m on m.church_id = c.church_id
      group by c.church_id, c.name, c.code, c.status
      order by c.created_at desc
    `),
  );
  return rows.map((row) => ({
    churchId: String(row.church_id),
    name: String(row.name),
    code: String(row.code),
    status: String(row.status),
    users: Number(row.users),
    members: Number(row.members),
  }));
}
