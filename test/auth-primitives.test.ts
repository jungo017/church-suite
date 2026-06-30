import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@church/core/auth/password";
import { signAccessToken, verifyAccessToken } from "@church/core/auth/jwt";

describe("password (scrypt)", () => {
  it("올바른 비밀번호는 통과, 틀린 비밀번호는 거부", async () => {
    const h = await hashPassword("secret123");
    expect(await verifyPassword("secret123", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });

  it("같은 비밀번호도 매번 다른 해시(솔트)", async () => {
    expect(await hashPassword("x")).not.toBe(await hashPassword("x"));
  });
});

describe("jwt (access token)", () => {
  it("서명·검증 라운드트립", async () => {
    const token = await signAccessToken({
      sub: "u1",
      church_id: "c1",
      roles: ["admin"],
      name: "N",
    });
    const claims = await verifyAccessToken(token);
    expect(claims?.sub).toBe("u1");
    expect(claims?.church_id).toBe("c1");
    expect(claims?.roles).toEqual(["admin"]);
  });

  it("변조/잘못된 토큰은 null", async () => {
    const token = await signAccessToken({
      sub: "u1",
      church_id: "c1",
      roles: [],
      name: "N",
    });
    expect(await verifyAccessToken(token + "x")).toBeNull();
    expect(await verifyAccessToken("garbage")).toBeNull();
  });
});
