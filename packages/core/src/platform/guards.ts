import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@church/core/auth/session";
import {
  hasPlatformRole,
  PLATFORM_ROLES,
  type PlatformRole,
} from "./roles";

export async function requirePlatformRole(
  allowed: PlatformRole[] = [PLATFORM_ROLES.SADMIN, PLATFORM_ROLES.MAINTENANCE],
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.scope !== "platform" || !hasPlatformRole(user.roles, allowed)) {
    redirect("/forbidden");
  }
  return user;
}
