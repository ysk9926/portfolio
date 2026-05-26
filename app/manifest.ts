import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "윤승규 | 풀스택 개발자 포트폴리오",
    short_name: "윤승규 포트폴리오",
    description:
      "풀스택 개발자 윤승규의 포트폴리오와 개발 블로그입니다. React, Next.js, TypeScript, AWS 기반 프로젝트 경험을 소개합니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
