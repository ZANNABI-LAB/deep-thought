import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 콘텐츠(`content/`)가 apps/web 밖 모노레포 루트에 있다.
   * 추적 루트를 올려주지 않으면 배포 시 파일이 누락된다.
   */
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),
};

export default nextConfig;
