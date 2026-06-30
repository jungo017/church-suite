import { describe, it, expect } from "vitest";
import { parseTenantHost } from "@church/core/tenant/host";

const root = "localhost";

describe("parseTenantHost", () => {
  it("서브도메인 → slug", () => {
    expect(parseTenantHost("cityhope.localhost", root)).toMatchObject({
      kind: "subdomain",
      slug: "cityhope",
    });
  });

  it("포트를 제거한다", () => {
    expect(parseTenantHost("cityhope.localhost:3000", root)).toMatchObject({
      kind: "subdomain",
      slug: "cityhope",
    });
  });

  it("루트/www 는 테넌트가 아님(root)", () => {
    expect(parseTenantHost("localhost", root).kind).toBe("root");
    expect(parseTenantHost("www.localhost", root).kind).toBe("root");
  });

  it("예약 서브도메인은 root", () => {
    expect(parseTenantHost("api.localhost", root).kind).toBe("root");
    expect(parseTenantHost("admin.localhost", root).kind).toBe("root");
  });

  it("그 외 도메인은 custom", () => {
    expect(parseTenantHost("mychurch.com", root).kind).toBe("custom");
  });

  it("빈 호스트는 none", () => {
    expect(parseTenantHost("", root).kind).toBe("none");
    expect(parseTenantHost(null, root).kind).toBe("none");
  });
});
