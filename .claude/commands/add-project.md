# Add Project Command

**Arguments:** `$ARGUMENTS` (path to the project directory to analyze)

---

## Purpose

Analyze a project directory and add it to the portfolio.

> **데이터 소스는 Supabase DB다.** `data/*.json`은 2026-09-12에 제거되었다
> (`docs/superpowers/plans/2026-09-12-remove-json-data-layer.md`).
> 절대 `data/` 아래에 파일을 새로 만들지 마라 — 사이트는 그 파일을 읽지 않으며,
> 되살아나면 stale 스냅샷 문제가 재발한다.

---

## Execution Steps

### Step 1: Validate Input

1. Parse the project directory path from `$ARGUMENTS`.
2. If no path is provided, ask the user:
   > "Please provide the path to the project directory. Example: `/add-project /path/to/my-project`"
3. Verify the directory exists using `ls`. If it does not exist, report an error and stop.

### Step 2: Analyze the Project

Use the **Task tool with `subagent_type: "Explore"`** to analyze the target project directory. The Explore agent should gather ALL of the following information from the project at `$ARGUMENTS`:

#### 2a. Project Name
- Read `package.json` → `name` field
- If no `package.json`, read `pom.xml`, `setup.py`, `Cargo.toml`, or `go.mod` for project name
- Fallback: use the directory name

#### 2b. STAR Description Generation

Generate a structured STAR description for the project. All generated content must be in **한국어 (Korean)**.

**2b-1. summary** (한 줄 요약):
- Read `package.json` → `description` field
- If empty, read `README.md` → extract first paragraph after the title
- Translate to Korean if in English
- Fallback: empty string

**2b-2. role** (역할):
- Analyze project structure to infer role:
  - If both `frontend/` and `backend/` (or `server/`, `api/`) directories exist → "풀스택 개발자"
  - If only frontend frameworks detected → "프론트엔드 개발자"
  - If only backend frameworks detected → "백엔드 개발자"
- Check `package.json` → `contributors` or `author` for contributor count
  - Solo project → append "(기여도 100%)"
  - Multiple contributors → append "(기여도 ___%)" and ask user later
- Fallback: "개발자"

**2b-3. background** (프로젝트 배경 — 마크다운):
- Search `README.md` for sections: Background, Motivation, Why, 배경, 동기, Problem
- If found, extract and convert to Korean markdown
- If not found, generate a draft from the project description:
  - Format: `## 프로젝트 배경\n\n[problem context]\n\n> 핵심 요구사항: [key requirement]`
- Use `\n` for line breaks in the JSON string

**2b-4. solutions** (핵심 구현 — 마크다운):
- Search `README.md` for sections: Architecture, Implementation, How, Features, 구현, 기술
- Analyze source directory structure (e.g., `src/`, `lib/`, `components/`) to identify key modules
- Generate markdown with numbered subsections:
  - Format: `### 1. [feature name]\n\n- [implementation detail]\n- [technology used]`
- Include inline code formatting for technology names (e.g., `` `React` ``, `` `FastAPI` ``)

**2b-5. results** (성과 — 마크다운):
- Search `README.md` for sections: Results, Performance, 성과, 결과
- If found, extract quantitative metrics and format as bullet list
- If NOT found, set to `null` and ask user during Step 5 confirmation
- Format: `## 성과\n\n- [metric 1]\n- [metric 2]`

**2b-6. troubleshooting** (트러블슈팅 — 마크다운, optional):
- Search `README.md` for sections: Troubleshooting, Challenges, Issues, 트러블슈팅, 문제해결
- If found, format with Problem → Cause → Solution → Result structure
- If NOT found, set to `null` (this field is optional)

**2b-7. Legacy description** (기존 호환):
- Still generate a plain text `description` field for backward compatibility
- Use the English description from `package.json` or README

#### 2c. Tech Stack Detection
Detect technologies from these sources:

**From `package.json` dependencies/devDependencies key matching:**
- react, next, vue, nuxt, angular, svelte, gatsby, remix, astro, vite
- typescript (also check `tsconfig.json` existence)
- tailwindcss (also check `tailwind.config.*`)
- express, nestjs, fastify, koa
- prisma, typeorm, sequelize, drizzle, mongoose
- jest, vitest, cypress, playwright
- redux, zustand, recoil, jotai, mobx
- graphql, @trpc/server
- styled-components, @mui/material, @chakra-ui/react, @shadcn/ui
- firebase, @supabase/supabase-js
- axios, sass, scss

**From config file existence (use Glob):**
- `tsconfig.json` → TypeScript
- `tailwind.config.*` → Tailwind CSS
- `next.config.*` → Next.js
- `nuxt.config.*` → Nuxt.js
- `vite.config.*` → Vite
- `Dockerfile` → Docker
- `docker-compose.*` → Docker
- `.github/workflows/*` → GitHub Actions
- `vercel.json` → Vercel
- `netlify.toml` → Netlify
- `firebase.json` → Firebase
- `jest.config.*` → Jest
- `vitest.config.*` → Vitest
- `playwright.config.*` → Playwright
- `.eslintrc*` or `eslint.config.*` → ESLint
- `prettier.config.*` or `.prettierrc*` → Prettier

**For non-JS projects:**
- `pom.xml` → Java, Spring Boot (check for spring-boot in pom)
- `build.gradle` → Java/Kotlin, Gradle
- `requirements.txt` or `pyproject.toml` → Python (check for django, flask, fastapi)
- `go.mod` → Go
- `Cargo.toml` → Rust
- `Gemfile` → Ruby

**Normalize detected tech names** to their canonical display names:
- react → React
- next → Next.js
- typescript → TypeScript
- tailwindcss → Tailwind CSS
- express → Express
- prisma → Prisma
- nestjs → NestJS
- vue → Vue.js
- nuxt → Nuxt.js
- zustand → Zustand
- firebase → Firebase
- mongodb/mongoose → MongoDB
- postgresql/pg → PostgreSQL
- mysql/mysql2 → MySQL
- redis/ioredis → Redis
- graphql → GraphQL
- docker → Docker
- aws-sdk/@aws-sdk → AWS
- styled-components → Styled Components
- @mui/material → Material UI
- @chakra-ui/react → Chakra UI

#### 2d. Project Period
- Run `git log --reverse --format="%ai" | head -1` in the project directory → first commit date
- Run `git log -1 --format="%ai"` → last commit date
- Format as "YYYY.MM - YYYY.MM"
- If the project is not a git repo, leave as empty string (will ask user later)

#### 2e. Features
- Read `README.md` → look for a "Features" or "Key Features" section (## Features, ## Key Features, etc.)
- Extract bullet points from that section
- If no features section found, set features to an empty array (will ask user later)

#### 2f. GitHub URL
- Run `git remote get-url origin` in the project directory
- Convert SSH URLs (`git@github.com:user/repo.git`) to HTTPS (`https://github.com/user/repo`)
- Remove trailing `.git` if present
- If no remote, leave as empty string

#### 2g. Deploy URL
- Check for `vercel.json` → if exists, note "Deployed on Vercel" (URL will need user input)
- Check for `netlify.toml` → similarly note Netlify
- Check `package.json` → `homepage` field
- Fallback: empty string

The Explore agent must return ALL gathered information in a structured format.

### Step 3: Load Current Portfolio Data

Read the following files from the portfolio project:
- DB `projects` 섹션 → 현재 최대 `id`와 중복 제목을 확인한다
- DB `skills` 섹션 → 기존 기술명을 가져온다 (중복 제거용)

### Step 4: Classify Skills into Categories

Use the following **Technology → Category mapping** to classify detected technologies:

```
Frontend (color: #3B82F6):
  React, Next.js, Vue.js, Nuxt.js, Angular, Svelte, Gatsby, Remix, Astro, Vite,
  TypeScript, JavaScript, HTML, CSS, HTML5, CSS3,
  Tailwind CSS, Sass, SCSS, Styled Components, Material UI, Chakra UI, Bootstrap, Shadcn/UI,
  Redux, Zustand, Recoil, Jotai, MobX,
  Jest, Vitest, Cypress, Playwright, Storybook,
  ESLint, Prettier

Backend (color: #10B981):
  Node.js, Deno, Bun,
  Express, NestJS, Fastify, Koa, Spring Boot, Django, Flask, FastAPI,
  Java, Python, Go, Rust, Ruby, PHP, Kotlin, C#,
  GraphQL, tRPC

Database (color: #8B5CF6):
  MySQL, PostgreSQL, SQLite, MariaDB,
  MongoDB, Redis, DynamoDB, Firestore, Supabase,
  Prisma, TypeORM, Sequelize, Drizzle, Mongoose

DevOps & Tools (color: #F59E0B):
  Git, GitHub, GitLab,
  GitHub Actions, Jenkins,
  Docker, Kubernetes,
  AWS, GCP, Azure, Vercel, Netlify, Firebase, Railway, Fly.io,
  Figma
```

Identify:
- **New skills**: Technologies detected in the project that are NOT in the current `skills` section (case-insensitive comparison) → will be added with level 60
- **Existing skills**: Technologies already in the `skills` section → **increase their level by +10** (cap at 100)
- **Unmapped skills**: Technologies not found in any category above (will need user input)

### Step 5: Confirm with User (AskUserQuestion)

Present the detected information to the user in this format:

```markdown
## Detected Project Information

- **Title**: [project name]
- **Period**: [YYYY.MM - YYYY.MM]
- **Description**: [description]
- **Tech Stack**: [list of detected technologies]
- **Features**: [list of detected features]
- **GitHub URL**: [url]
- **Deploy URL**: [url or "none"]
- **isMain**: [recommend true if 3+ technologies, otherwise false]
- **shortDescription**: [auto-generated one-liner from description]

## STAR Description Preview

- **Summary**: [summary]
- **Role**: [role]
- **Background** (preview):
  [first 2-3 lines of background markdown]
- **Solutions** (preview):
  [first 2-3 lines of solutions markdown]
- **Results** (preview):
  [first 2-3 lines of results markdown]
- **Troubleshooting** (preview):
  [first 2-3 lines or "없음"]

## Skills Update Preview

### New skills to add:
- [Category]: [Skill Name] (level: 60)
- ...

### Existing skills (level +10):
- [Skill Name]: [current level] → [new level]
- ...

### Unmapped technologies (need your input):
- [Tech Name] → which category?
```

Use `AskUserQuestion` to ask:
> "Does this look correct? Choose an option or type corrections."

Options:
1. "Looks good, proceed" — continue to Step 6
2. "I want to edit STAR sections" — iterate through each STAR section (summary, role, background, solutions, results, troubleshooting) and let the user edit or approve each one individually
3. "Skip STAR, use plain description" — omit the `star` field entirely and use only the legacy `description` format
4. "I want to make other changes" — ask what to change, apply corrections, show again
5. "Cancel" — abort the command

If there are unmapped technologies, ask the user which category each belongs to (Frontend, Backend, Database, DevOps & Tools) before proceeding.

If features are empty, ask the user to provide features as a comma-separated list.

If the period is empty (no git), ask the user to provide the period in "YYYY.MM - YYYY.MM" format.

If results is `null` (not found in README), ask the user to provide quantitative results.

### Step 6: Write to the DB (not to files)

프로젝트와 스킬은 Supabase `section_payloads`에 저장된다. 쓰기 경로는 두 가지다.

#### 6a. 권장 — 관리자 UI

1. `/admin`에 로그인한다.
2. `projects` 섹션 편집기에서 항목을 추가한다.
3. `skills` 섹션에서 신규 기술을 추가하고, 기존 기술은 레벨을 +10 한다 (상한 100).

저장은 `POST /api/admin/sections/[sectionKey]` → `admin_replace_section()`으로
전체 섹션을 교체한다. **부분 병합이 아니므로** 기존 항목을 포함한
전체 배열을 보내야 한다.

#### 6b. 자동화 — 내부 REST

Obsidian 자동화(`project_registry_sync.py`)는
`POST /api/internal/sync/portfolio`로 `projects`,
`project-portfolio-sync`, `activity-heatmap`을 한 트랜잭션으로 쓴다.
현재 값은 같은 경로의 `GET`으로 읽는다.

#### 주의

- `id`는 기존 최대값 +1이 아니라 **DB의 현재 값**을 기준으로 계산한다.
- `projects`와 `project-portfolio-sync`는 **정규화된 title로 조인**된다
  (`lib/projects/portfolio.ts`의 `mergePortfolioProjects`).
  제목을 바꾸면 양쪽을 함께 바꿔야 썸네일·스크린샷·기간이 유지된다.
- 이미지는 계속 파일 기반이다 (`public/images/projects/generated/**`).

### Step 7: Report Completion

Output a summary:

```markdown
## Done!

### projects.json
- Added "[project title]" (id: [N])

### skills.json
- Added "[Skill]" to [Category] (level: 60)
- Added "[Skill]" to [Category] (level: 60)
- Leveled up "[Skill]" in [Category]: [old] → [new]
- Leveled up "[Skill]" in [Category]: [old] → [new]

### Next Steps
- Run `npm run build` to verify the portfolio builds correctly
- Check the portfolio site to see the new project
- Set the thumbnail path via the admin `projects` editor if needed
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No arguments provided | Ask user for the project path |
| Directory does not exist | Print error and stop |
| No `package.json` found | Analyze from README, config files, and directory name |
| Not a git repository | Ask user for the project period manually |
| Duplicate project title | Warn user and ask whether to proceed or cancel |
| Technology not in category map | Ask user to choose a category |

---

## Important Rules

- All user-facing messages must be in **English**
- Never overwrite existing data — only append new entries
- Always confirm with the user before writing to files
- Use `Edit` tool for file modifications, not `Write` (to preserve existing content)
- Skill deduplication is **case-insensitive** (e.g., "next.js" matches "Next.js")
- Default skill level for new skills is **60**
- The `thumbnail` field should always be set to `""` (empty string) for new projects
