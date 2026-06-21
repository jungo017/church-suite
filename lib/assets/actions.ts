"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { createAsset, updateAsset, deleteAsset, type AssetInput } from "./service";
import {
  createDepartment,
  createLocation,
  createCategory,
} from "./classification";
import { addRepair, deleteRepair } from "./repairs";
import { isAssetType, isAssetStatus } from "./constants";

/**
 * 자산 모듈 서버 액션 (스펙 §16 단계4). 모두 assets:write 권한 가드.
 * churchId 는 인증 사용자(JWT)에서, 데이터 접근은 service(withTenant→RLS) 경유.
 */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.ASSETS_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

function parseAssetForm(fd: FormData): AssetInput {
  const assetType = str(fd, "assetType");
  const status = str(fd, "status");
  const quantity = str(fd, "quantity");
  return {
    name: str(fd, "name") ?? "",
    assetType: assetType && isAssetType(assetType) ? assetType : undefined,
    status: status && isAssetStatus(status) ? status : undefined,
    quantity: quantity ? Number(quantity) : undefined,
    tag: str(fd, "tag"),
    categoryId: str(fd, "categoryId"),
    departmentId: str(fd, "departmentId"),
    locationId: str(fd, "locationId"),
    acquiredAt: str(fd, "acquiredAt"),
    acquiredCost: str(fd, "acquiredCost"),
    note: str(fd, "note"),
  };
}

export async function createAssetAction(fd: FormData) {
  const user = await requireWrite();
  const input = parseAssetForm(fd);
  if (!input.name) throw new Error("name_required");
  await createAsset(user.church_id, input);
  revalidatePath("/assets");
  redirect("/assets");
}

export async function updateAssetAction(assetId: string, fd: FormData) {
  const user = await requireWrite();
  const input = parseAssetForm(fd);
  if (!input.name) throw new Error("name_required");
  await updateAsset(user.church_id, assetId, input);
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function deleteAssetAction(assetId: string) {
  const user = await requireWrite();
  await deleteAsset(user.church_id, assetId);
  revalidatePath("/assets");
  redirect("/assets");
}

export async function createDepartmentAction(fd: FormData) {
  const user = await requireWrite();
  const name = str(fd, "name");
  if (name) await createDepartment(user.church_id, name);
  revalidatePath("/assets/classification");
}

export async function createLocationAction(fd: FormData) {
  const user = await requireWrite();
  const name = str(fd, "name");
  if (name) await createLocation(user.church_id, name);
  revalidatePath("/assets/classification");
}

export async function createCategoryAction(fd: FormData) {
  const user = await requireWrite();
  const name = str(fd, "name");
  if (name) await createCategory(user.church_id, name);
  revalidatePath("/assets/classification");
}

export async function addRepairAction(assetId: string, fd: FormData) {
  const user = await requireWrite();
  const description = str(fd, "description");
  if (!description) throw new Error("description_required");
  await addRepair(user.church_id, {
    assetId,
    description,
    repairedAt: str(fd, "repairedAt"),
    cost: str(fd, "cost"),
    vendor: str(fd, "vendor"),
  });
  revalidatePath(`/assets/${assetId}`);
}

export async function deleteRepairAction(assetId: string, repairId: string) {
  const user = await requireWrite();
  await deleteRepair(user.church_id, repairId);
  revalidatePath(`/assets/${assetId}`);
}
