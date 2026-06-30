"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@church/core/rbac/guards";
import { requireModuleWrite } from "@/lib/billing/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import {
  ensureSite,
  setSiteStatus,
  setSiteTheme,
  createBoard,
  createPost,
  setPostPublished,
  deletePost,
  createPage,
  updatePage,
} from "./admin";
import { approveNewFamily, rejectNewFamily } from "./intake";
import { reflectOffering } from "./offering";

/** CMS 어드민 서버 액션. site:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.SITE_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  await requireModuleWrite(res.user.church_id, "site");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

export async function setSiteStatusAction(fd: FormData) {
  const user = await requireWrite();
  await ensureSite(user.church_id);
  const status = str(fd, "status") === "published" ? "published" : "draft";
  await setSiteStatus(user.church_id, status);
  revalidatePath("/site");
}

const SITE_THEMES = ["modern", "warm", "minimal", "dark"] as const;

export async function setSiteThemeAction(fd: FormData) {
  const user = await requireWrite();
  const theme = str(fd, "theme") ?? "modern";
  if (!SITE_THEMES.includes(theme as (typeof SITE_THEMES)[number])) return;
  await setSiteTheme(user.church_id, theme);
  revalidatePath("/site");
}

export async function createBoardAction(fd: FormData) {
  const user = await requireWrite();
  const slug = str(fd, "slug");
  const name = str(fd, "name");
  if (!slug || !name || !SLUG_RE.test(slug)) throw new Error("invalid_input");
  await createBoard(user.church_id, { slug, name, type: str(fd, "type") ?? "general" });
  revalidatePath("/site");
}

export async function createPostAction(boardId: string, fd: FormData) {
  const user = await requireWrite();
  const title = str(fd, "title");
  if (!title) throw new Error("title_required");
  await createPost(user.church_id, {
    boardId,
    title,
    body: str(fd, "body") ?? "",
    published: fd.get("published") === "on",
  });
  revalidatePath(`/site/boards/${boardId}`);
}

export async function setPostPublishedAction(
  boardId: string,
  postId: string,
  published: boolean,
) {
  const user = await requireWrite();
  await setPostPublished(user.church_id, postId, published);
  revalidatePath(`/site/boards/${boardId}`);
}

export async function deletePostAction(boardId: string, postId: string) {
  const user = await requireWrite();
  await deletePost(user.church_id, postId);
  revalidatePath(`/site/boards/${boardId}`);
}

export async function createPageAction(fd: FormData) {
  const user = await requireWrite();
  const slug = str(fd, "slug");
  const title = str(fd, "title");
  if (!slug || !title || !SLUG_RE.test(slug)) throw new Error("invalid_input");
  const { pageId } = await createPage(user.church_id, { slug, title });
  revalidatePath("/site");
  redirect(`/site/pages/${pageId}`);
}

export async function updatePageAction(pageId: string, fd: FormData) {
  const user = await requireWrite();
  await updatePage(user.church_id, pageId, {
    title: str(fd, "title") ?? undefined,
    body: str(fd, "body") ?? "",
    published: fd.get("published") === "on",
  });
  revalidatePath(`/site/pages/${pageId}`);
}

// ── 접수(새가족/온라인헌금) ──
export async function approveNewFamilyAction(reqId: string) {
  const user = await requireWrite();
  const today = new Date().toISOString().slice(0, 10);
  await approveNewFamily(user.church_id, reqId, today);
  revalidatePath("/site/new-family");
}

export async function rejectNewFamilyAction(reqId: string) {
  const user = await requireWrite();
  await rejectNewFamily(user.church_id, reqId);
  revalidatePath("/site/new-family");
}

export async function reflectOfferingAction(offeringId: string, fd: FormData) {
  const user = await requireWrite();
  const accountId = str(fd, "accountId");
  if (!accountId) return;
  const today = new Date().toISOString().slice(0, 10);
  await reflectOffering(user.church_id, offeringId, accountId, today);
  revalidatePath("/site/offerings");
}
