import { getCurrentUser } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";

/**
 * 파일 다운로드 (설문 첨부 등). 인증 + 교회 프리픽스(church-{id}/) 소유권 검증.
 * 키는 추측 불가한 UUID이고 인가된 화면에서만 노출된다.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const name = url.searchParams.get("name") || "download";
  if (!key) return new Response("Bad Request", { status: 400 });

  // 테넌트 격리: 본인 교회 프리픽스만 허용
  if (!key.startsWith(`church-${user.church_id}/`)) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await getStorage().get(key);
  if (!data) return new Response("Not Found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
