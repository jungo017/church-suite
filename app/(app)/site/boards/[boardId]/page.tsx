import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getBoard, listPosts } from "@church/module-site/admin";
import {
  createPostAction,
  setPostPublishedAction,
  deletePostAction,
} from "@church/module-site/actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function BoardPostsPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");

  const board = await getBoard(user.church_id, boardId);
  if (!board) notFound();
  const posts = await listPosts(user.church_id, boardId);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">{board.name}</h1>

      <form action={createPostAction.bind(null, boardId)} className="flex flex-col gap-2">
        <input name="title" required placeholder="제목" className={input} />
        <textarea name="body" rows={4} placeholder="내용" className={input} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> 즉시 공개
        </label>
        <button className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">글 등록</button>
      </form>

      <ul className="flex flex-col gap-1 text-sm">
        {posts.length === 0 && <li className="text-muted-foreground">글이 없습니다.</li>}
        {posts.map((p) => (
          <li key={p.postId} className="flex items-center justify-between gap-2 border-b border-border py-1.5">
            <span className="font-medium">{p.title}</span>
            <div className="flex items-center gap-2">
              <span className={p.published ? "text-success" : "text-muted-foreground"}>
                {p.published ? "공개" : "비공개"}
              </span>
              <form action={setPostPublishedAction.bind(null, boardId, p.postId, !p.published)}>
                <button className="text-xs underline">{p.published ? "비공개" : "공개"}</button>
              </form>
              <form action={deletePostAction.bind(null, boardId, p.postId)}>
                <button className="text-xs text-destructive">삭제</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <Link href="/site" className="text-sm underline">← 홈페이지 관리</Link>
    </section>
  );
}
