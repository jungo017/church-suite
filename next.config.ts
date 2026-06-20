import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 디렉터리의 무관한 lockfile이 루트로 잡히지 않도록 프로젝트 루트를 고정.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
