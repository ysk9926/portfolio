---
slug: npm-to-pnpm-migration
title: "npm에서 pnpm으로 갈아탄 이유와, 실제로 좋아진 것들"
summary: "프로젝트 4~5개를 동시에 굴리다 보니 npm의 node_modules가 한계처럼 느껴졌어요. pnpm으로 바꾸고 디스크 용량·설치 속도·모노레포 다루는 법이 어떻게 달라졌는지 정리합니다."
tags: [pnpm, npm, Node.js, Monorepo, DevTools]
status: published
thumbnail:
---

# npm에서 pnpm으로 갈아탄 이유와, 실제로 좋아진 것들

요즘 사이드로 굴리는 프로젝트가 늘다 보니 `node_modules`가 디스크의 1티어 적이 되더라고요. 한참 일하고 있으면 Mac 디스크가 빨개지고, `du -sh node_modules` 찍어보면 한 프로젝트가 1GB 넘어가는 경우도 흔했어요. 결국 거의 모든 신규 프로젝트를 **pnpm**으로 옮겼고, 모노레포가 끼어있는 ERP 프로젝트는 특히 효과를 크게 봤어요.

이 글은 npm을 쓰다 pnpm으로 갈아타볼까 고민 중인 1~3년차 개발자 분들을 위해, "왜 굳이?"와 "그래서 뭐가 좋은데?"를 실제 경험 위주로 정리한 글이에요.

## 한 줄 요약

> **pnpm은 의존성을 전역 한 곳(content-addressable store)에 저장하고, 프로젝트의 `node_modules`에는 하드링크/심볼릭링크만 깔아주는 패키지 매니저예요.** 그래서 디스크가 절약되고, 설치가 빠르고, "이 패키지 어디서 들어왔지?" 같은 유령 의존성 문제도 줄어들어요.

## 왜 npm에서 떠나게 됐나

npm 자체가 나쁜 도구라기보다는, 제가 일하는 방식이랑 잘 안 맞는 지점이 몇 개 쌓였어요.

### 1) 같은 패키지가 매번 복사된다

npm은 기본적으로 프로젝트마다 `node_modules`를 **복사본**으로 들고 있어요. Next.js + React + TypeScript 조합만 깔아도 한 프로젝트당 수백 MB가 기본이고, 프로젝트 5개면 그게 그대로 5배가 돼요. 같은 버전의 `react`를 5번 디스크에 깔고 있는 셈이죠.

### 2) 호이스팅이 만드는 유령 의존성

npm은 의존성을 평탄화(flat)해서 `node_modules` 루트에 끌어올리는데, 이러면 **`package.json`에 명시하지 않은 패키지를 import 해도 동작**해버려요.

```ts
// package.json에는 lodash가 없는데
// 어떤 의존성이 lodash를 끌고 들어와서 동작하는 경우
import _ from "lodash";
```

당장은 동작하지만, 나중에 그 의존성이 빠지거나 버전이 바뀌면 어디서 터질지 모르는 시한폭탄이에요. 저도 한 번 `pg` 패키지를 직접 안 깔았는데도 동작해서 의아했던 적이 있어요. 평소엔 별 거 아닌데, 운영 빌드에서 한 번 터지면 추적하는 데 시간이 꽤 들어요.

### 3) 모노레포에서 npm이 잘 안 풀린다

ERP 프로젝트는 `web`(Next.js)이랑 `storage`(공유 패키지)를 같이 두는 구조였어요. npm workspaces도 있긴 하지만, 의존성 격리가 약하고, `pnpm --filter web build` 같은 깔끔한 워크스페이스 명령이 부족해서 결국 pnpm으로 갔어요.

## pnpm이 다른 점

pnpm을 한 줄로 설명하면 **"하드링크 + 심볼릭링크로 만든 node_modules"** 예요.

```
~/.local/share/pnpm/store/v3/files/...   ← 진짜 패키지 파일들 (전역 1벌)
       ↑ hardlink
project-a/node_modules/.pnpm/react@19.2.3/node_modules/react/...
       ↑ symlink
project-a/node_modules/react   ← 우리가 import 하는 진입점
```

핵심은 두 가지예요.

1. **content-addressable store**: 같은 버전의 패키지는 OS 전역에서 **딱 한 번만** 디스크에 저장돼요. 프로젝트들은 그 파일을 하드링크로 공유해요. → 디스크 절약
2. **nested + symlink**: `node_modules`가 평탄화되어 있지 않고, 각 패키지가 자기 의존성만 볼 수 있도록 격리돼요. → 유령 의존성 차단

```mermaid
graph LR
    subgraph "npm 방식"
    P1[project-a/node_modules<br/>react, react-dom, ...] -.복사.-> D1[(디스크)]
    P2[project-b/node_modules<br/>react, react-dom, ...] -.복사.-> D1
    P3[project-c/node_modules<br/>react, react-dom, ...] -.복사.-> D1
    end

    subgraph "pnpm 방식"
    Q1[project-a/node_modules] -.hardlink.-> Store[(~/.local/share/pnpm/store<br/>react@19.2.3 1벌)]
    Q2[project-b/node_modules] -.hardlink.-> Store
    Q3[project-c/node_modules] -.hardlink.-> Store
    end
```

## 갈아타고 실제로 좋아진 것들

### 1) 디스크 용량이 줄어요

체감상 가장 큰 변화예요. Next.js 프로젝트 4~5개를 동시에 띄워두는 상황에서, 전체 `node_modules` 합산이 절반 이하로 줄었어요. 새 프로젝트를 `pnpm install`하면 거의 대부분의 의존성이 이미 store에 있어서 다운로드도 안 일어나요.

### 2) 설치가 진짜로 빠르다

캐시가 차 있는 상태에서 `pnpm install`은 거의 즉시 끝나요. 다운로드가 아니라 **하드링크를 거는 작업**이라 디스크 IO만 일어나거든요. CI에서도 마찬가지로 의존성 캐시 hit률이 npm보다 잘 나와요.

| 항목 | npm | pnpm (캐시 hit) |
|------|-----|------|
| 첫 설치 (콜드) | 비슷 | 비슷 |
| 재설치 (캐시 hit) | 수십 초 | 수 초 |
| 다른 프로젝트에서 같은 패키지 | 또 다운로드 | store에서 링크만 |

### 3) `package.json`에 적은 것만 import 가능

pnpm을 깔고 나면 `package.json`에 없는 패키지를 import하면 그냥 에러가 나요. 처음엔 좀 불편하지만, 익숙해지면 의존성이 깔끔해져요. 운영 빌드에서 "왜 이게 동작했지?"가 사라지는 안정감이 커요.

### 4) 워크스페이스가 깔끔해진다

모노레포 명령이 직관적이에요.

```bash
# web 패키지에서만 dev 실행
pnpm --filter web dev

# storage 패키지에서만 빌드
pnpm --filter storage build

# 모든 워크스페이스 패키지에 한 번에 설치
pnpm -r install
```

ERP 프로젝트에서는 루트 `package.json` 스크립트를 거의 다 `pnpm --filter web ...` 형태로 정리했어요. 어떤 패키지에서 도는 명령인지가 명확해지니까 onboarding 비용도 줄었어요.

## 갈아탈 때 신경 쓸 점

장점만 있는 건 아니에요. 갈아타기 전에 알아두면 좋은 것들:

### 1) 일부 패키지는 hoisting을 기대한다

pnpm은 기본적으로 의존성을 격리하기 때문에, "내가 직접 안 깔았는데 동작하던" 패키지들이 갑자기 import 못 하게 돼요. 대부분은 정직하게 `package.json`에 추가해주면 끝나지만, 레거시 도구 중에 `node_modules` 평탄화를 가정하고 짠 것들이 가끔 말썽이에요. 그럴 땐 `.npmrc`에 `shamefully-hoist=true`를 두면 npm처럼 동작하게 풀어줄 수 있어요. (단, "shamefully"라는 이름값처럼 진짜 마지막 수단이에요.)

### 2) Docker 빌드 캐시 전략을 조금 바꿔야 한다

npm에서는 보통 이렇게 하잖아요.

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

pnpm에서는 lockfile 이름이 `pnpm-lock.yaml`이고, corepack을 쓰거나 pnpm을 명시적으로 설치하는 단계가 추가돼요.

```dockerfile
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
```

`--frozen-lockfile`은 npm의 `npm ci`와 같은 의미예요. CI에선 거의 무조건 이걸 써야 lockfile 드리프트가 안 생겨요.

### 3) `packageManager` 필드 지정해두기

`package.json`에 `"packageManager": "pnpm@9.15.0"` 같이 박아두면, 협업자나 CI가 다른 버전으로 install 하는 사고를 막을 수 있어요. corepack과 같이 쓰면 버전 고정 효과가 강력해져요.

```json
{
  "name": "myapp",
  "packageManager": "pnpm@9.15.0"
}
```

## 어떻게 갈아탔나 (현실적인 순서)

이미 npm으로 굴러가는 프로젝트를 옮길 때는 보통 이렇게 했어요.

1. `pnpm` 설치 (corepack enable 또는 `npm i -g pnpm`)
2. `rm -rf node_modules package-lock.json`
3. `pnpm import` — 기존 `package-lock.json`을 보고 `pnpm-lock.yaml`을 만들어줘요. 버전을 동일하게 유지하면서 갈아탈 수 있어 안전해요.
4. `pnpm install`
5. `pnpm build` / 테스트 / 로컬 실행으로 동작 확인
6. CI 설정의 `npm ci` → `pnpm install --frozen-lockfile`
7. Dockerfile / 배포 스크립트 점검

마이그레이션 자체는 30분~1시간 안에 끝나는 작업이에요. 빌드 깨지는 부분은 대부분 "유령 의존성"이라 정직하게 `package.json`에 옮겨 적어주면 끝나요.

## 그래서 무조건 pnpm으로 가야 하나

저는 새 프로젝트면 거의 무조건 pnpm으로 시작해요. 하지만:

- **이미 잘 굴러가는 1인 프로젝트**라면 굳이 옮길 필요는 없어요. 비용 대비 이득이 적어요.
- **CI 캐시 전략을 바꿀 여유가 없는 상황**이라면 일단 보류해도 괜찮아요.
- **팀이 yarn이나 npm에 강하게 묶여있다면** 합의가 먼저예요.

반대로 다음 상황이면 강하게 추천드려요.

- 사이드 프로젝트 여러 개를 동시에 굴린다
- 모노레포(특히 워크스페이스)를 다룬다
- 디스크 용량이 늘 빠듯하다
- 유령 의존성 때문에 한 번이라도 데인 적이 있다

## 마무리

패키지 매니저는 평소엔 잘 안 보이는 인프라지만, 신경 쓰기 시작하면 개발 사이클 전체의 체감 속도가 달라져요. pnpm은 "디스크 + 속도 + 정확성" 세 박자가 균형 잡혀 있어서, 적어도 제 워크플로엔 잘 맞았어요. 갈아타기도 어렵지 않으니, 한 프로젝트만 골라서 한 번 시도해보시는 걸 추천드려요.
