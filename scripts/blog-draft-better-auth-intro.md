---
slug: better-auth-intro-for-beginners
title: "Better Auth, 왜 요즘 이걸 자주 쓰게 됐을까 — 장점과 처음 셋업하는 법"
summary: "NextAuth 쓰다가 Better Auth로 갈아탄 이유와, Next.js 프로젝트에 처음부터 붙이는 방법을 정리했어요. 1~3년차 분이 보고 그대로 따라할 수 있게 라우트 핸들러, 클라이언트, 미들웨어, 세션 보호까지 한 번에 짚어요."
tags: [BetterAuth, Auth, NextJS, TypeScript, Prisma]
status: published
thumbnail:
---

# Better Auth, 왜 요즘 이걸 자주 쓰게 됐을까 — 장점과 처음 셋업하는 법

## 들어가며

요즘 새 프로젝트를 시작할 때마다 인증은 [Better Auth](https://www.better-auth.com/)로 붙이고 있어요. 사내툴, ERP, 사이드 프로젝트까지 — 한 번 익혀두니까 다음 프로젝트 셋업이 30분이면 끝나더라구요.

이 글은 두 가지를 정리해요.

1. **왜 Better Auth인가** — NextAuth(이젠 Auth.js)나 직접 구현 대비 좋았던 점
2. **Next.js 프로젝트에 처음부터 붙이는 법** — DB 어댑터, 라우트 핸들러, 클라이언트, 세션 보호까지

이제 막 개발 시작해서 "로그인 기능 어떻게 붙이지" 단계인 분들도 보고 따라할 수 있게 썼어요. Next.js App Router + Prisma(또는 Drizzle) 기준으로 갑니다.

## Better Auth가 뭔가요

한 줄로 말하면 **타입스크립트 풀스택 프레임워크(Next.js, Nuxt, SvelteKit 등)에서 쓰는 인증 라이브러리**예요. NextAuth/Auth.js와 같은 자리의 도구라고 보면 돼요.

특징을 짧게 짚으면:

- **프레임워크 종속이 적음** — Next.js, Nuxt, SvelteKit, Hono 등 어디든 붙일 수 있음
- **DB 어댑터 선택** — Prisma, Drizzle, Kysely, MongoDB 등 거의 다 지원
- **타입이 진짜 잘 잡힘** — 세션, 사용자 객체 모두 자동 추론
- **플러그인 시스템** — 2FA, magic link, organization, admin 같은 기능을 플러그인으로 끼워넣음

## 왜 NextAuth 대신 이걸 쓰게 됐나

처음에는 NextAuth로 갔어요. 가장 유명하고 자료도 많으니까요. 그런데 두세 프로젝트 만들다 보니 자꾸 같은 데서 막혔어요.

| 항목 | NextAuth/Auth.js | Better Auth |
|------|------------------|-------------|
| DB 스키마 통제 | 어댑터가 강요 | 직접 마이그레이션 파일 받아서 내가 관리 |
| 이메일/비번 + 세션 | 별도 처리 필요 | 기본 내장 |
| 세션 정책 (만료/갱신) | 콜백 안에서 짜야 함 | 옵션 한 줄로 설정 |
| 타입 추론 | 모듈 augmentation 필요 | `typeof auth`로 끝 |
| 플러그인 (2FA, org 등) | 직접 구현 | 공식 플러그인 |
| 클라이언트 SDK | hook 위주 | `authClient.signIn.email()` 류, 그대로 호출 |

특히 좋았던 두 가지를 콕 집으면 이거예요.

### 1. DB 스키마를 내가 관리한다

Better Auth는 `npx @better-auth/cli generate`를 돌리면 **Prisma/Drizzle 스키마 코드를 출력해줘요.** 그걸 내 schema.prisma에 붙여넣고 평소처럼 `prisma migrate`로 마이그레이션하면 끝이에요.

블랙박스가 없어요. user 테이블에 컬럼 하나 추가하고 싶으면 그냥 추가해요. 어댑터가 자동으로 자기 테이블을 만들어주는 게 아니라, **내 마이그레이션 히스토리에 그대로 들어가요.**

### 2. 타입 추론이 별다른 설정 없이 잘 잡힌다

```ts
const session = await auth.api.getSession({ headers: await headers() });
// session.user.email — 자동 완성됨, any 아님
```

NextAuth는 `next-auth.d.ts`에 모듈 보강을 해줘야 커스텀 필드가 타입에 잡혔는데, 여기는 `auth` 객체 자체가 타입의 원천이라서 그런 작업이 필요 없어요.

## 처음부터 붙이는 법 — Next.js + Prisma 기준

ERP 프로젝트에서 실제로 쓰는 셋업을 기준으로 풀게요. (Drizzle도 거의 똑같아요. 어댑터 이름만 바뀜.)

### 0. 전체 그림

```mermaid
flowchart LR
    A[브라우저] -->|signIn.email\(\)| B[authClient]
    B -->|fetch /api/auth/*| C[/api/auth/...all/]
    C --> D[auth 인스턴스]
    D --> E[(DB: user/session/account)]
    F[서버 컴포넌트] -->|auth.api.getSession| D
```

핵심은 세 덩어리예요.

1. `lib/auth.ts` — **서버용 auth 인스턴스** (DB 어댑터, 시크릿, 세션 정책)
2. `app/api/auth/[...all]/route.ts` — **catch-all 라우트** (로그인/로그아웃/세션 조회 다 여기로)
3. `lib/auth-client.ts` — **브라우저용 SDK** (`signIn`, `signOut`, `useSession`)

### 1. 설치

```bash
npm i better-auth
```

DB는 이미 Prisma든 Drizzle이든 잡혀있다고 가정할게요. 없으면 그것부터 먼저 잡고 오는 게 편해요.

### 2. 환경변수

```env
# .env
BETTER_AUTH_SECRET="아무 긴 랜덤 문자열"
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="..."
```

`BETTER_AUTH_SECRET`는 세션 쿠키 서명에 쓰여요. `openssl rand -base64 32` 같은 걸로 뽑으세요. 운영에선 절대 깃에 안 들어가게.

### 3. `lib/auth.ts` — 서버용 인스턴스

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,    // 7일
    updateAge: 60 * 60 * 24,        // 24시간마다 만료 갱신
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export type Auth = typeof auth;
```

Drizzle을 쓴다면 어댑터만 바뀝니다.

```ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@/db";

database: drizzleAdapter(getDb(), {
  provider: "pg",
  schema: {
    user: schema.user,
    session: schema.session,
    account: schema.account,
    verification: schema.verification,
  },
}),
```

`emailAndPassword` 외에 소셜 로그인이 필요하면 `socialProviders: { google: { ... } }` 형태로 더하면 돼요. 처음엔 이메일/비번 한 가지만 두고 시작하는 걸 추천해요.

### 4. DB 스키마 생성

```bash
npx @better-auth/cli generate
```

이걸 돌리면 Better Auth가 필요로 하는 모델(`user`, `session`, `account`, `verification`)이 출력돼요. Prisma면 `schema.prisma`에 붙여넣고:

```bash
npx prisma migrate dev --name add-auth
```

이러면 평소 쓰던 마이그레이션 흐름 그대로 끝이에요.

### 5. catch-all 라우트 핸들러

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

이게 끝이에요. `/api/auth/sign-in`, `/api/auth/sign-out`, `/api/auth/session` 같은 엔드포인트가 전부 이 catch-all 한 줄로 처리돼요.

### 6. 클라이언트 SDK

```ts
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

쓰는 쪽은 이렇게 단순해요.

```tsx
"use client";

import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  return (
    <form
      action={async (formData) => {
        await signIn.email({
          email: String(formData.get("email")),
          password: String(formData.get("password")),
        });
      }}
    >
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">로그인</button>
    </form>
  );
}
```

회원가입이면 `signUp.email({ email, password, name })`, 로그아웃이면 `signOut()`. 끝.

## 서버에서 세션 확인하기

App Router에선 서버 컴포넌트/액션에서 직접 세션을 꺼내요.

```tsx
// app/(dashboard)/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <div>안녕하세요 {session.user.email}</div>;
}
```

`session.user`는 우리가 schema에 넣은 필드까지 다 타입으로 잡혀있어요. `any`를 만질 일이 없어요.

## 라우트를 한 번에 보호하기 — 미들웨어

페이지마다 `getSession` 호출이 귀찮다면 미들웨어로 큰 우산을 씌울 수 있어요.

```ts
// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

여기서 한 가지 주의할 점이 있어요. **미들웨어에서 하는 건 "쿠키 존재 여부 확인"이지 "세션 검증"이 아니에요.** 쿠키만 있고 DB의 세션이 만료됐을 수도 있죠. 그래서 실제 보호는 서버 컴포넌트/액션의 `getSession`에서 한 번 더 해야 해요.

미들웨어는 "비로그인 사용자가 보호 라우트에 접근하는 걸 빨리 튕겨내는 1차 필터" 정도로 두는 게 깔끔해요.

## 자주 막히는 부분

처음 붙이면서 제가 헛바퀴 돌렸던 지점 몇 개를 짚어둘게요.

### 1. `BETTER_AUTH_URL`이 안 맞으면 쿠키가 안 박힘

배포 후 운영 도메인이 `https://myapp.com`인데 환경변수가 `http://localhost:3000`으로 남아있으면 쿠키가 안 박혀요. 도메인/프로토콜이 안 맞으면 브라우저가 거부합니다. 배포 환경마다 다시 세팅하세요.

### 2. `auth.api.getSession`은 매번 DB를 칠 수 있음

세션 정책에 따라 매 요청마다 DB를 한 번 더 칠 수 있어요. 페이지 컴포넌트가 여러 곳에서 호출한다면 한 번 호출해서 props로 내려주는 패턴이 깔끔해요. RSC라면 React `cache`로 감싸는 것도 한 방법이에요.

### 3. CLI generate 결과를 그대로 안 붙임

스키마 생성 결과는 **참고용 출력**이에요. 이미 `User` 테이블이 있다면 필드를 병합해야 해요. 그냥 덮어쓰면 기존 데이터가 날아갈 수 있어요. 마이그레이션 diff를 꼭 한 번 보고 적용하세요.

## 정리

처음 셋업할 때 손으로 만져야 하는 파일은 결국 이 다섯 개예요.

1. `.env` — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
2. `lib/auth.ts` — 서버용 `betterAuth({})` 인스턴스
3. `prisma/schema.prisma` (또는 drizzle schema) — generate 결과 반영 + migrate
4. `app/api/auth/[...all]/route.ts` — catch-all
5. `lib/auth-client.ts` — 브라우저용 SDK

여기까지 잡아두면 그 뒤로 로그인 폼, 회원가입 폼, 보호된 페이지는 다 비슷한 패턴이에요. 그리고 진짜 좋은 건 **다음 프로젝트 시작할 때 이걸 거의 그대로 복사해서 쓸 수 있다는 것**이에요. 한 번 손에 익혀두면 인증이 더 이상 "프로젝트 시작 때 막히는 구간"이 아니게 돼요.

저는 이 패턴으로 사내툴, ERP, 사이드 프로젝트 다 동일하게 가고 있고 만족하면서 쓰고 있어요. 막 시작하는 분이면 NextAuth 자료 찾아 헤매기 전에 Better Auth 한 번 해보시는 걸 추천해요.
