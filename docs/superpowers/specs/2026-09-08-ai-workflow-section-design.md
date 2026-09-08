# AI Workflow 섹션 설계 (2026-09-08)

## 배경

기존 홈은 Hero → About → Skills(언어·프레임워크 숙련도 바) → Archiving → Activity → Projects → Career 순서로, 첫인상이 "어떤 언어를 쓰는가"에 맞춰져 있었다. 이제 강조점은 **AI를 어떻게 활용하는가**로 옮긴다. 사용 중인 AI 도구, 일하는 순서, 직접 만든 스킬·슬래시 커맨드·자동화가 언어보다 먼저 보여야 한다.

## 결정

### 정보 구조

- 순서: Hero → **AI Workflow(신설)** → About → **Tech Stack**(구 Skills) → Archiving → Activity → Projects → Career.
- Hero에는 AI 하이라이트 줄(`$ Claude Code · Codex CLI · 스킬 38개 …`)을 추가하고 클릭 시 `#ai-workflow`로 이동한다. 문구는 `ai-workflow` 페이로드의 `highlights`에서 온다.
- Skills는 제목을 Tech Stack으로 바꾸고 퍼센트 바를 없앤다. 카테고리별 칩 목록에 근거(`detail`)만 붙인다. 섹션 id는 분석 연속성을 위해 `skills`를 유지한다.
- 내비: `AI` 항목을 About 앞에 둔다. DB에 저장된 내비가 오래된 경우를 대비해 레이아웃에서 AI·Blog 항목을 보정 삽입한다.

### 데이터 경로

- 새 섹션 키 `ai-workflow`. 페이로드는 `section_payloads.payload` jsonb에 **그대로** 저장한다.
- 기존 `export_section_payload` / `admin_replace_section`은 섹션별 정규화 테이블을 다루는 1,300줄짜리 함수라 건드리지 않는다. 앱은 `RAW_JSON_SECTIONS`에 속한 키를 테이블에서 직접 읽고 쓴다.
- DB에 행이 없으면 `data/ai-workflow.json`으로 폴백한다. 마이그레이션 전에도 페이지가 깨지지 않는다.
- 마이그레이션 `202609080001_ai_workflow_section.sql`은 `section_payloads`의 키 체크 제약에 `ai-workflow`만 추가한다.
- 시드 스크립트에 `--only <keys>` 옵션을 추가했다. 예: `npm run supabase:seed -- --only ai-workflow`.
- 관리자 화면에서는 JSON 모드로만 편집한다(중첩 구조가 깊어 폼 에디터는 만들지 않는다).

### 페이로드 구조

```
eyebrow, headline, intro, highlights[]
stats[]        { label, value, note? }
tools[]        { name, kind, model?, summary, points[], accent: claude|codex|product }
workflow[]     { step, title, description, skills[] }
skillGroups[]  { title, client: 공용|Claude|Codex, description, skills[{ name, summary }] }
commands[]     { name, kind: slash|hook|automation|script, description }
```

### 비주얼

- 방향: "에디토리얼 콘솔". 따뜻한 종이 톤(`#f6f3ee`) 바탕에 어두운 콘솔 패널, IBM Plex Mono와 테라코타 악센트(`#d97757`).
- 도구 카드는 Claude(테라코타)·Codex(그린)·제품 AI(블루)로 악센트를 나눈다.
- 일하는 순서는 터미널 트랜스크립트처럼 `$ 01 …` 행으로 보여주고, 스크롤 진입 시 타이핑되듯 순차 등장한다.
- 스킬 레지스트리는 `~/skills/<group>` 경로를 단 카드 6장. 그룹당 4개 미리 보여주고 나머지는 펼친다.

## 콘텐츠 근거

- 스킬 38개: `~/workspace/ysk9926/skills-personal` 19개 + 채용 시뮬레이션 10개 + Codex 콘텐츠 파이프라인 6개 + env-sync, portfolio-build, erp-flowchart.
- 슬래시 커맨드 3개: `/add-project`(프로젝트), `/gitinit-personal`, `/gitinit-poooling`(글로벌).
- 자동화 3개: git-activity LaunchAgent, 내부 portfolio sync API, post-blog 스크립트.
- Claude Code 설정: `~/.claude/settings.json`(모델, 훅 10종, 플러그인). Codex 설정: `~/.codex/config.toml`.

## 범위 밖

- 스킬 목록 자동 수집 스크립트(파일시스템 스캔 → JSON 생성)는 추후 과제.
- 운영 DB의 `site` 섹션(히어로 문구·내비)은 이번 변경에서 덮어쓰지 않았다. `data/site.json`에 새 문구를 반영했으니 검토 후 `npm run supabase:seed -- --only site`로 적용한다.
