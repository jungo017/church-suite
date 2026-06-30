import { describe, it, expect } from "vitest";
import { qrDataUrl, assetUrl } from "@church/module-assets/qr";

describe("자산 QR", () => {
  it("QR 데이터 URL(PNG)을 생성한다", async () => {
    const url = await qrDataUrl("http://cityhope.localhost:3000/assets/abc");
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
    expect(url.length).toBeGreaterThan(100);
  });

  it("assetUrl 이 자산 상세 절대 URL 을 만든다", () => {
    const url = assetUrl("cityhope.localhost:3000", "a1");
    expect(url).toContain("cityhope.localhost:3000/assets/a1");
  });
});
