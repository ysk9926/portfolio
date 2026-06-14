# Blog Design System

Scope: This document defines the visual language for the blog-only routes and components. AI agents must read this file before generating or editing any UI under `app/(site)/blog/**` or `components/blog/**`.

- Applies to: `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx`, `app/(site)/blog/tags/[tag]/page.tsx`, `components/blog/*`
- Does NOT apply to: admin blog editor (`app/admin/**`, `components/admin/blog/**`), other site sections
- Mode: Light only. Dark mode is intentionally out of scope.
- Stack: Next.js (App Router) + Tailwind CSS v4 + Pretendard + `lucide-react`

---

## 1. Color Tokens

All colors are Tailwind v4 palette references. Use the Tailwind class name as the source of truth; HEX values are documentation.

### Surfaces

| Role | Token | HEX | Usage |
|------|-------|-----|-------|
| Page background | `bg-white` | `#FFFFFF` | Blog index, detail, tag pages |
| Card surface | `bg-white` | `#FFFFFF` | Post cards, comment cards, TOC |
| Subtle surface | `bg-neutral-50` | `#FAFAFA` | Empty states, blockquote, reply box, edit cancel button |
| Inline code surface | `bg-neutral-100` | `#F5F5F5` | Inline `<code>`, tag chips, table header |
| Code block surface | `bg-neutral-900` | `#171717` | Fenced code blocks |
| Inverse surface (CTA) | `bg-neutral-900` | `#171717` | Primary button, active tag chip, active TOC item |

### Borders

| Role | Token | Usage |
|------|-------|-------|
| Default border | `border-neutral-200` | Cards, comment items, dividers (`border-t`), TOC, table cells |
| Input border | `border-neutral-300` | Form inputs, textareas, inactive tag chips |
| Hover border | `border-neutral-400` | Card hover, blockquote left rule |
| Focus border | `border-neutral-900` | Input/textarea focus state |
| Dashed empty border | `border-dashed border-neutral-300` | Empty list/comment state |

### Text

| Role | Token | Usage |
|------|-------|-------|
| Primary heading | `text-gray-900` | H1, H2, H3, H4, strong, author name |
| Body | `text-gray-700` | Paragraph, list item, blockquote text |
| Strong body | `text-gray-800` | Comment body |
| Secondary | `text-gray-600` | Page subtitle, card summary |
| Meta | `text-neutral-500` | Date, view count, "목차" label, breadcrumb link |
| Meta hover | `text-neutral-900` | Breadcrumb link hover |
| Inline code text | `text-neutral-800` | Inline `<code>` |
| Code block text | `text-neutral-100` | Fenced code block content |
| Inverse text | `text-white` | Active tag chip, active TOC item, primary button |

### Accent — Rose (reserved for "like" and "delete")

Use only for like buttons and destructive delete affordances. Do not use rose for any other purpose.

| Role | Token | Usage |
|------|-------|-------|
| Like active background | `bg-rose-500` | Post like button (active state) |
| Like active hover | `hover:bg-rose-700` | (Comment delete submit hover) |
| Like soft background | `bg-rose-100` | Comment like (active state) |
| Like soft text | `text-rose-600` | Comment like (active state) |
| Like outline hover | `hover:border-rose-500 hover:text-rose-500` | Post like button (inactive hover) |
| Delete background | `bg-rose-50` | Delete confirmation block |
| Delete text | `text-rose-700` | Delete confirmation label |
| Delete border | `border-rose-300` / focus `border-rose-500` | Delete password input |
| Error text | `text-rose-600` | Form error messages |
| Delete submit | `bg-rose-600 hover:bg-rose-700` | Final delete button |

---

## 2. Typography

Font family is Pretendard (loaded globally via `--font-pretendard`). No font override in blog routes.

### Scale

| Element | Class | Notes |
|---------|-------|-------|
| Index page H1 ("Blog") | `text-4xl font-bold text-gray-900` | Page title only |
| Detail page H1 (post title) | `text-3xl md:text-4xl font-bold leading-tight text-gray-900` | Responsive |
| Index page subtitle | `mt-2 text-gray-600` | One-line description under H1 |
| Detail page summary | `mt-3 text-base text-gray-600` | Below post title |
| Markdown H2 | `text-2xl font-bold text-gray-900 mt-10 mb-4 first:mt-0` | + `scroll-mt-24` for TOC anchoring |
| Markdown H3 | `text-xl font-semibold text-gray-900 mt-8 mb-3` | + `scroll-mt-24` |
| Markdown H4 | `text-lg font-semibold text-gray-900 mt-6 mb-2` | No TOC anchor |
| Card title (post list) | `text-xl font-semibold text-gray-900` | Hover: `group-hover:text-neutral-700` |
| Comment section heading | `text-xl font-bold text-gray-900` | With `MessageCircle` icon |
| Markdown paragraph | `text-gray-700 leading-relaxed my-4` | Wrapped in `text-base leading-7` container |
| Card summary | `text-sm text-gray-600 line-clamp-2` | 2-line clamp on post cards |
| Comment body | `text-sm leading-relaxed text-gray-800 whitespace-pre-wrap` | |
| Meta row | `text-xs text-neutral-500` | Date, view, like, comment counts |
| Tag chip text | `text-xs` (filter chips) / `text-[10px]` (inline tags on cards) | |
| TOC "목차" label | `text-[11px] font-semibold uppercase tracking-wider text-neutral-500` | |
| Markdown link | `text-neutral-900 underline underline-offset-2 hover:text-neutral-600` | |
| Markdown strong | `font-semibold text-gray-900` | |
| Inline code | `font-mono text-[0.92em]` | + neutral-100 bg, neutral-800 text |
| Code block | `text-sm leading-relaxed` | + neutral-900 bg, neutral-100 text |

### Reading container

The blog post markdown is rendered inside `<div className="text-base leading-7">`. Do not change this base; all child components inherit from it.

---

## 3. Spacing & Layout

### Page chrome

- Top padding: `pt-24` (clears the fixed site header — 96px)
- Bottom padding: `pb-20`
- Min height: `min-h-screen` on the outer wrapper

### Containers

| Page | Class |
|------|-------|
| Blog index (`/blog`) | `mx-auto max-w-4xl px-4` |
| Blog detail (`/blog/[slug]`) | `mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 xl:grid-cols-[1fr_240px]` |
| Tag page | Same as blog index |

The detail page uses a two-column grid only at `xl` breakpoint (≥1280px). Below `xl`, TOC is hidden via `hidden xl:block` on the `<aside>`.

### Vertical rhythm

- Section gap between header and content: `mt-10` (40px) on detail; `mb-10` then `mb-8` on index
- Post list item gap: `space-y-6` (24px)
- Comment list gap: `space-y-6` (24px); replies use `space-y-3` (12px)
- Card internal padding: `p-6` (24px)
- Comment card padding: `p-4` (16px)
- TOC padding: `p-4` (16px)

### Sticky offsets

- TOC sticky top: `sticky top-24` (matches `pt-24`)
- Heading scroll margin: `scroll-mt-24` on h2/h3 (so TOC anchor jumps clear the fixed header)
- `html { scroll-padding-top: 80px }` is set globally in `app/globals.css`

---

## 4. Components

### 4.1 Post Card (`BlogPostCard`)

```
<article className="rounded-2xl border border-neutral-200 bg-white p-6
                    transition hover:border-neutral-400 hover:shadow-sm">
  <Link className="group block">
    <div className="flex flex-col gap-4 md:flex-row">
      {thumbnail && (
        <img className="h-32 w-full rounded-lg object-cover md:h-28 md:w-44" />
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold text-gray-900
                       transition group-hover:text-neutral-700">{title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{summary}</p>
        <MetaRow />
      </div>
    </div>
  </Link>
  {tags.length > 0 && <InlineTagList />}
</article>
```

- Border radius: `rounded-2xl` (cards), `rounded-lg` (card thumbnail)
- Hover: border darkens (`neutral-200` → `neutral-400`) AND `shadow-sm` appears
- Layout: stacks on mobile, side-by-side from `md:` (≥768px); thumbnail is `md:h-28 md:w-44`

### 4.2 Tag Chips

Two distinct chip styles:

**Filter chip (navigation, top of list)** — `BlogTagNav`
```
rounded-full border px-3 py-1 text-xs transition
```
- Inactive: `border-neutral-300 text-neutral-700 hover:border-neutral-500`
- Active: `border-neutral-900 bg-neutral-900 text-white`
- Icon: `<Tag className="h-3 w-3" />` (omitted on the "전체" chip)

**Inline tag (on cards and post header)** — `BlogPostCard`, detail header
```
inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5
text-[10px] text-neutral-600 hover:bg-neutral-200
```
- Icon: `<Tag className="h-2.5 w-2.5" />`

### 4.3 Markdown Renderer (`BlogMarkdown`)

Custom `Components` map for `react-markdown` + `remark-gfm`. See `components/blog/BlogMarkdown.tsx` for the authoritative implementation. Element rules:

| Element | Class |
|---------|-------|
| `h2` | `scroll-mt-24 text-2xl font-bold text-gray-900 mt-10 mb-4 first:mt-0` |
| `h3` | `scroll-mt-24 text-xl font-semibold text-gray-900 mt-8 mb-3` |
| `h4` | `text-lg font-semibold text-gray-900 mt-6 mb-2` |
| `p` | `text-gray-700 leading-relaxed my-4` |
| `a` | `text-neutral-900 underline underline-offset-2 hover:text-neutral-600`; external (`href` starts with `http`) opens in new tab with `rel="noopener noreferrer"` |
| `ul` | `my-4 list-disc space-y-1 pl-6` |
| `ol` | `my-4 list-decimal space-y-1 pl-6` |
| `li` | `text-gray-700 leading-relaxed` |
| `blockquote` | `my-5 border-l-4 border-neutral-400 bg-neutral-50 px-4 py-2 italic text-gray-700` |
| `code` (inline) | `rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.92em] text-neutral-800` |
| `code` (block) | `block overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed text-neutral-100` |
| `pre` | `my-5` |
| `img` | `my-6 mx-auto max-w-full rounded-lg` |
| `table` | wrapper `my-5 overflow-x-auto`, table `w-full border-collapse text-sm` |
| `th` | `border border-neutral-300 bg-neutral-100 px-3 py-2 text-left` |
| `td` | `border border-neutral-200 px-3 py-2` |
| `hr` | `my-8 border-neutral-200` |
| `strong` | `font-semibold text-gray-900` |

Heading IDs are slugified via `slugifyHeading` from `lib/blog/toc.ts` with collision suffixes (`-1`, `-2`, …).

### 4.4 Table of Contents (`BlogToc`)

- Visibility: `hidden xl:block` — desktop only (≥1280px)
- Container: `<aside>` then inner `<nav>`
- Nav style: `sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 text-sm`
- Label: `text-[11px] font-semibold uppercase tracking-wider text-neutral-500` ("목차")
- Item base: `block truncate rounded px-2 py-1 transition-colors`
- Item inactive: `text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900`
- Item active: `bg-neutral-900 text-white`
- H3 indent: `pl-3` on the `<li>`
- Activation: IntersectionObserver with `rootMargin: '-30% 0px -60% 0px'`
- Hidden when fewer than 2 entries exist (`entries.length < 2`)

### 4.5 Post Like Button (`PostLikeButton`)

```
inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
transition disabled:opacity-60
```
- Inactive: `border-neutral-300 bg-white text-neutral-700 hover:border-rose-500 hover:text-rose-500`
- Active: `border-rose-500 bg-rose-500 text-white`
- Icon: `<Heart className="h-4 w-4" />`, fills (`fill-current`) when active
- Persistence: `localStorage` key `blog:like:post:{slug}`
- Placement: `mt-12 flex justify-center` below the article body

### 4.6 Comment Section (`CommentSection`)

**Container**
```
section: mt-14 border-t border-neutral-200 pt-10
heading: text-xl font-bold text-gray-900 (with MessageCircle h-5 w-5)
```

**Comment item**
```
article: rounded-xl border border-neutral-200 bg-white p-4
  (deleted: + opacity-70)
nickname: font-semibold text-gray-900
timestamp: text-xs text-neutral-500
body: mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800
deleted body: mt-3 text-sm italic text-neutral-500
```

**Reply nesting**
- Replies render under `<ul className="mt-3 space-y-3 pl-6 md:pl-10">`
- Reply form box: `mt-4 rounded-lg bg-neutral-50 p-3`
- Depth limit: 1 (no replies on replies)

**Comment like (inline)**
```
inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition
  disabled:opacity-60
```
- Inactive: `text-neutral-500 hover:bg-neutral-100`
- Active: `bg-rose-100 text-rose-600`
- Icon: `<Heart className="h-3 w-3" />` (fills on active)
- Persistence: `localStorage` key `blog:like:comment:{id}`

**Action buttons (수정/삭제/답글)**
```
inline-flex items-center gap-1 rounded px-2 py-1 text-xs
text-neutral-500 hover:bg-neutral-100  (수정/삭제)
text-neutral-500 hover:text-neutral-800  (답글)
```

### 4.7 Forms

**Input / textarea (base)**
```
rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm
focus:border-neutral-900 focus:outline-none
```
- Textarea: add `w-full resize-y`
- Use `grid grid-cols-1 gap-3 md:grid-cols-2` for nickname + password row

**Primary submit button**
```
rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white
transition hover:bg-neutral-700 disabled:opacity-60
```
- Small variant (edit save): `px-3 py-1.5 text-xs`

**Cancel / secondary button**
```
rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs
font-medium text-neutral-700 hover:bg-neutral-50
```

**Delete confirmation block**
```
form: mt-3 space-y-2 rounded-md bg-rose-50 p-3
label: text-xs text-rose-700
input: w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm
       focus:border-rose-500 focus:outline-none
submit: rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white
        hover:bg-rose-700 disabled:opacity-60
```

**Form error text**: `text-xs text-rose-600` (or `text-rose-700` inside delete block)

### 4.8 Empty States

```
rounded-xl border border-dashed border-neutral-300 bg-neutral-50
px-6 py-16 text-center text-sm text-neutral-500    (post list)

rounded-lg border border-dashed border-neutral-300 bg-neutral-50
px-4 py-10 text-center text-sm text-neutral-500    (comments)
```

### 4.9 Breadcrumb / Back link

Detail page back link to `/blog`:
```
inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900
<ArrowLeft className="h-4 w-4" /> 블로그 목록
```

### 4.10 Meta Row (date, views, likes, comments)

```
flex flex-wrap items-center gap-3 text-xs text-neutral-500
  span: inline-flex items-center gap-1
  icon: h-3 w-3
```

Icon mapping: `Calendar` (date), `Clock` (reading time, detail only), `Eye` (views), `Heart` (likes, card only), `MessageCircle` (comments), `Tag` (tags).

---

## 5. Iconography

Library: `lucide-react`. No other icon library. Stroke width and color inherit from the parent.

| Use | Icon | Size |
|-----|------|------|
| Date | `Calendar` | `h-3 w-3` |
| Reading time | `Clock` | `h-3 w-3` |
| View count | `Eye` | `h-3 w-3` |
| Like (post button) | `Heart` | `h-4 w-4` (fills when active) |
| Like (comment inline) | `Heart` | `h-3 w-3` (fills when active) |
| Comment count / section heading | `MessageCircle` | `h-3 w-3` (meta) / `h-5 w-5` (heading) |
| Tag (filter chip) | `Tag` | `h-3 w-3` |
| Tag (inline on card) | `Tag` | `h-2.5 w-2.5` |
| Back to list | `ArrowLeft` | `h-4 w-4` |
| Edit | `Pencil` | `h-3 w-3` |
| Delete | `Trash2` | `h-3 w-3` |
| Reply | `Reply` | `h-3 w-3` |

---

## 6. Borders & Radii

| Radius | Token | Used on |
|--------|-------|---------|
| `rounded` (4px) | default | Action buttons, TOC item |
| `rounded-md` (6px) | inputs, primary submit, cancel, secondary buttons |
| `rounded-lg` (8px) | TOC nav, code blocks, markdown images, card thumbnails, reply box |
| `rounded-xl` (12px) | comment item, empty post-list state |
| `rounded-2xl` (16px) | post card |
| `rounded-full` | tag chips, like buttons (post + comment) |

Default border width is `border` (1px). Blockquote uses `border-l-4`. No shadow at rest; cards apply `hover:shadow-sm` only.

---

## 7. Motion

Global keyframes already defined in `app/globals.css` (`fade-in-up`, `pulse-dot`, `bounce-arrow`, modal enter/exit). Blog components rely only on Tailwind `transition` / `transition-colors`. Do not add new keyframes for blog UI; reuse `transition` on hover and active states.

- Card hover: `transition` (border + shadow)
- Tag chip / button hover: `transition` or `transition-colors`
- TOC item: `transition-colors`
- Smooth scroll: relies on global `html { scroll-behavior: smooth }`

---

## 8. Responsive Breakpoints

Tailwind defaults. Blog-specific behavior:

| Breakpoint | Change |
|------------|--------|
| `md` (≥768px) | Post card switches to horizontal layout (thumbnail beside text); form nickname/password row becomes 2-column; reply nesting indent grows from `pl-6` to `md:pl-10` |
| `xl` (≥1280px) | Detail page reveals right-side TOC column (`xl:grid-cols-[1fr_240px]`, `<aside className="hidden xl:block">`); detail H1 grows from `text-3xl` to `md:text-4xl` |

Mobile-first throughout. No fixed widths.

---

## 9. Accessibility & Semantics

- Use semantic HTML in markdown rendering: `<article>` for post cards and comments, `<aside>` for TOC, `<nav>` for tag filter and TOC, `<header>` for page intros.
- TOC `<nav>` does not need `aria-label`; tag nav uses `aria-label="블로그 태그"`.
- All interactive elements are real `<button>` or `<Link>` — no clickable `<div>`.
- Heading anchors must use `scroll-mt-24` so the fixed header does not occlude the target.
- External markdown links must include `target="_blank" rel="noopener noreferrer"`.
- Like buttons disable themselves while a request is in flight (`disabled:opacity-60`).

---

## 10. Agent Prompt Guide

When generating or editing blog UI, copy the relevant snippet below into your reasoning before writing code.

**Color quick reference**

| Want | Use |
|------|-----|
| Page bg | `bg-white` |
| Card bg | `bg-white` + `border-neutral-200` |
| Soft fill | `bg-neutral-50` |
| Primary CTA / active chip | `bg-neutral-900 text-white` |
| Body text | `text-gray-700` |
| Heading | `text-gray-900` |
| Meta | `text-neutral-500` |
| Like / delete | `rose-*` (only these two affordances) |
| Inline code | `bg-neutral-100 text-neutral-800` |
| Code block | `bg-neutral-900 text-neutral-100` |

**Ready prompts**

- "Add a new card-style block to a blog list page" → use `rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 hover:shadow-sm`. Title `text-xl font-semibold text-gray-900`, body `text-sm text-gray-600`, meta row `text-xs text-neutral-500`. Icons from `lucide-react` at `h-3 w-3`.
- "Add a new filter chip to the tag nav" → match `BlogTagNav` exactly: `rounded-full border px-3 py-1 text-xs transition`, active = `border-neutral-900 bg-neutral-900 text-white`, inactive = `border-neutral-300 text-neutral-700 hover:border-neutral-500`.
- "Add a destructive action button" → `rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60`. Wrap in a `bg-rose-50 p-3 rounded-md` container if it needs a confirmation step.
- "Render a new markdown element" → first check `components/blog/BlogMarkdown.tsx`. Match the existing element style table in §4.3 before adding a new mapping. Do not introduce new color tokens.
- "Add a new meta indicator to post card / detail meta row" → wrap in `<span className="inline-flex items-center gap-1">` with an icon from §5 at `h-3 w-3`, followed by the value. Keep the row at `text-xs text-neutral-500`.

---

## 11. Do / Don't

**Do**
- Use Tailwind utility classes inline — no `*.module.css` for blog UI.
- Reuse exactly the tokens listed here; if a state needs a color, pick the closest existing role.
- Treat `rose-*` as reserved for like and delete only.
- Use `scroll-mt-24` on any anchorable heading.
- Hide TOC under `xl` — never show it on mobile/tablet.

**Don't**
- Do not introduce new font families, font weights outside `font-semibold`/`font-bold`, or sizes outside the scale in §2.
- Do not add box shadows beyond `hover:shadow-sm` on cards.
- Do not add gradients, glassmorphism, or backdrop blur.
- Do not introduce dark mode classes (`dark:*`) in blog routes — out of scope.
- Do not use accent colors outside the `neutral` / `gray` / `rose` palettes documented above (no blue, green, purple, etc.).
- Do not change the container widths: index = `max-w-4xl`, detail = `max-w-6xl`.
- Do not bypass `BlogMarkdown`'s component map by injecting raw HTML.

---

## 12. File Map (authoritative implementations)

| Concern | File |
|---------|------|
| Index list page | `app/(site)/blog/page.tsx` |
| Detail page | `app/(site)/blog/[slug]/page.tsx` |
| Tag page | `app/(site)/blog/tags/[tag]/page.tsx` |
| Post card | `components/blog/BlogPostCard.tsx` |
| Post list | `components/blog/BlogPostList.tsx` |
| Tag filter | `components/blog/BlogTagNav.tsx` |
| Markdown renderer | `components/blog/BlogMarkdown.tsx` |
| TOC | `components/blog/BlogToc.tsx` |
| Post like button | `components/blog/PostLikeButton.tsx` |
| Comments + replies + like | `components/blog/CommentSection.tsx` |
| Global tokens (Pretendard, base) | `app/globals.css` |

When this document and the implementation disagree, update one to match the other in the same PR — do not let them drift.
