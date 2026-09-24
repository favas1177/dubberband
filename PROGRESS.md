# Dubberband — Project Progress Checkpoint

> **Last updated:** 2026-09-24 · After Step 3 completion

---

## ✅ Completed Milestones

### Step 1: App Shell & Dashboard Layout

**Route:** `/`

**Key files created:**

| File | Purpose |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Route-group layout — mounts `<Sidebar />` + `ml-64` content offset |
| `src/app/(dashboard)/page.tsx` | Dashboard Server Component — seeds projects, renders `DashboardClient` |
| `src/app/layout.tsx` | Root layout — html/body shell, Inter font, global CSS only |
| `src/app/globals.css` | Tailwind v4 `@theme` block — full Indigo/Teal/Slate token system |
| `src/components/layout/Sidebar.tsx` | Fixed 256px dark sidebar — nav items, credits progress bar, user profile |
| `src/components/layout/TopHeader.tsx` | Frosted-glass sticky header — breadcrumbs, search, bell, "New Translation" CTA |
| `src/components/dashboard/DashboardClient.tsx` | Client Component — owns modal open state + dynamic project list |
| `src/components/dashboard/ProjectCard.tsx` | Card with gradient thumbnail, hover play reveal, status + language badges |
| `src/components/ui/button.tsx` | Gradient primary button (Indigo→Teal) + shadcn variants |
| `src/components/ui/card.tsx` | Hover-lift card with Indigo shadow tint |
| `src/components/ui/badge.tsx` | Status badges: `completed` (teal), `processing` (amber), `draft` (slate) |
| `src/components/ui/progress.tsx` | Radix Progress — Indigo→Teal gradient fill |
| `src/lib/utils.ts` | `cn()` — clsx + tailwind-merge utility |
| `tailwind.config.ts` | (Superseded by v4 `@theme` in globals.css — kept for reference) |
| `postcss.config.mjs` | `@tailwindcss/postcss` plugin for Tailwind v4 |
| `tsconfig.json` | Strict TypeScript, `@/*` alias to `src/` |

---

### Step 2: Upload & Translation Configuration Modal

**Trigger:** "New Translation" button in `TopHeader` + hero banner + empty-state card

**Key files created / modified:**

| File | Purpose |
|---|---|
| `src/components/translation/TranslationModal.tsx` | Full 3-step Radix Dialog modal (dark slate-900 theme) |
| `src/components/ui/dialog.tsx` | Radix `@radix-ui/react-dialog` primitives — dark frosted-glass styled |
| `src/components/ui/switch.tsx` | Radix `@radix-ui/react-switch` — Indigo gradient active state |
| `src/app/(dashboard)/layout.tsx` | *(updated)* Sidebar layout added to route group |
| `src/components/layout/TopHeader.tsx` | *(updated)* Added `onNewTranslation?: () => void` prop |

**Modal internals:**
- **Step 1 — Video Ingestion:** `react-dropzone` file zone (`.mp4`, `.mov`, `.mkv`, ≤500 MB) with file preview card; URL tab with YouTube/Google Drive mock verification via `Fetch` button
- **Step 2 — Language Config:** Source select (Auto-Detect default), target select + 7 quick-pick flag badges (`hi`, `ta`, `te`, `es`, `de`, `ja`, `fr`); collapsible Advanced Options accordion with three `Switch` toggles: Dynamic Audio Duration · Remove Background Noise · Auto-Generate Subtitles
- **Step 3 — Actions:** Credit banner "2 Credits · Available: 340"; dual action buttons:
  - **"1-Click Translate"** — Indigo/Teal gradient → appends `processing` card → closes modal
  - **"Proofread Script"** — ghost secondary → appends `draft` card → navigates to `/translate/[id]/proofread`
- Buttons disabled until file/URL verified **and** target language selected; full state reset on close

---

### Step 3: Split-Screen Proofread Editor

**Route:** `/translate/[id]/proofread` (dynamic segment)

**Key files created / modified:**

| File | Purpose |
|---|---|
| `src/app/translate/[id]/proofread/page.tsx` | Server Component — resolves `params.id`, renders `ProofreadClient` |
| `src/app/translate/[id]/proofread/layout.tsx` | Passthrough layout — no sidebar, full viewport |
| `src/components/translation/ProofreadClient.tsx` | Client orchestrator — wires video seek ↔ block highlight ↔ render flow |
| `src/components/translation/VideoPreview.tsx` | Custom dark HTML5 player — gradient scrubber, skip ±5s, volume popup, Indigo-Teal play button |
| `src/components/translation/TranscriptEditor.tsx` | Scrollable segment list — per-block seek button, timestamp badge, auto-resize `<textarea>`, dirty/saved indicator |
| `src/components/ui/toast.tsx` | Slide-up toast notification + `useToast` hook (auto-dismiss 3.5s) |
| `src/app/layout.tsx` | *(updated)* Stripped to html/body shell — Sidebar moved to `(dashboard)` group |

**Layout:** Full-viewport `h-screen`, no scrollbar on outer shell
- **Left 60%** — `VideoPreview` on `bg-slate-950` / `bg-black`; custom controls on `bg-slate-900`
- **Right 40%** — `TranscriptEditor` on `bg-slate-50` / `bg-white`; sticky footer on `bg-white`

**Seeded transcript:** 6 English→Hindi blocks (`blk-001` → `blk-006`, timestamps 00:00–00:32)

**Interaction flows:**
- Clicking ▶ on a block → seeks video + highlights that block with Indigo ring
- Typing in textarea → auto-resize → "Editing…" amber badge → fades to "Saved" teal after 1.8s
- "Confirm & Render Video" CTA → 2s spinner → button turns ✅ → success toast → redirect to `/` after 2s

---

## 🏗 Current Architectural State

### Key Libraries Installed (`package.json`)

| Library | Version | Usage |
|---|---|---|
| `next` | 16.x (Turbopack) | App Router, Server/Client Components, `useRouter` |
| `react` / `react-dom` | 19.x | |
| `typescript` | 5.x strict | All source files |
| `tailwindcss` | 4.x | CSS-first `@theme` config in `globals.css` |
| `@tailwindcss/postcss` | latest | PostCSS integration for Tailwind v4 |
| `lucide-react` | 0.460+ | All icons throughout the app |
| `@radix-ui/react-dialog` | latest | `TranslationModal` overlay |
| `@radix-ui/react-progress` | latest | Credits progress bar |
| `@radix-ui/react-switch` | latest | Advanced options toggles |
| `@radix-ui/react-slot` | latest | `Button` asChild support |
| `@radix-ui/react-accordion` | installed | Reserved (not yet used in UI) |
| `@radix-ui/react-select` | installed | Reserved |
| `react-dropzone` | latest | File drop zone in `TranslationModal` |
| `class-variance-authority` | 0.7.x | `Button` variant system |
| `clsx` + `tailwind-merge` | latest | `cn()` utility |

### Design System Tokens (defined in `src/app/globals.css` `@theme`)

| Token category | Values |
|---|---|
| **Primary palette** | `--color-indigo-*` (50–950), `--color-teal-*` (50–950) |
| **Neutral palette** | `--color-slate-*` (50–950) |
| **Semantic** | `--color-primary: #4f46e5`, `--color-ring: #4f46e5` |
| **Border radius** | `--radius-xl: 1rem` (default for cards/buttons) |
| **Font** | `--font-sans: 'Inter'` (loaded via `next/font/google`) |
| **Video bg** | `bg-slate-950` / `bg-black` (dark-mode video container) |
| **Editor bg** | `bg-white` / `bg-slate-50` (light-mode transcript panel) |

### Mocked Data Models

```typescript
// Project card (src/components/dashboard/ProjectCard.tsx)
interface Project {
  id: string;
  title: string;
  thumbnailGradient: string; // Tailwind gradient class
  thumbnailIcon: string;     // Emoji
  sourceLanguage: string;
  targetLanguage: string;
  status: "completed" | "processing" | "draft";
  duration: string;          // "MM:SS"
  createdAt: string;
  progress?: number;         // 0–100, shown for "processing" status
}

// Transcript block (src/components/translation/TranscriptEditor.tsx)
interface TranscriptBlock {
  id: string;
  startTime: string;     // "MM:SS" display
  endTime: string;
  startSeconds: number;  // For video seeking
  text: string;          // Source language
  translatedText: string; // Editable target language
}
```

---

## 🚀 Next Immediate Objective

### ⏳ Step 4: API Proxy Routes — **ACTIVE PENDING TASK**

**Goal:** The frontend must never call 3rd-party APIs directly. Build Next.js Route Handlers under `/api/translate/` to proxy all external service calls, with API keys stored securely in `.env.local`.

**Planned routes:**

| Route | Method | Purpose |
|---|---|---|
| `/api/translate/start` | `POST` | Accepts `{ videoUrl, sourceLanguage, targetLanguage, options }` → proxies to **Sarvam AI** translation endpoint |
| `/api/translate/tts` | `POST` | Sends translated text → **Sarvam AI** TTS → returns audio blob |
| `/api/translate/lipsync` | `POST` | Sends original video + translated audio → **HeyGen Pay-As-You-Go** lip-sync API |
| `/api/translate/status/[jobId]` | `GET` | Polls HeyGen job status → returns `{ status, progress, videoUrl }` |

**Environment variables needed (`.env.local`):**
```
SARVAM_API_KEY=
SARVAM_API_BASE_URL=https://api.sarvam.ai
HEYGEN_API_KEY=
HEYGEN_API_BASE_URL=https://api.heygen.com
```

**Key implementation rules from PRD:**
- All route handlers must strip internal API keys before returning responses
- Return generic "Dubberband" branded error messages (not raw provider errors)
- Use `next/headers` for secure server-side key access (no `NEXT_PUBLIC_` prefix)
- Add request validation with Zod schemas before forwarding to providers
