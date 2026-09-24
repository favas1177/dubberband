# Dubberband — Project Progress Checkpoint

> **Last updated:** 2026-09-24 · Vercel Deployment & Sarvam AI Integration Phase

---

## ✅ Completed Milestones

### Step 1: App Shell & Dashboard Layout
**Route:** `/`
- Full Indigo/Teal/Slate dark theme design system built with Tailwind CSS.
- Fixed sidebar layout with navigation, credit usage indicators, and user info.
- Dynamic project grid displaying translation jobs, status badges (`completed`, `processing`, `draft`), and language pairs.

---

### Step 2: Upload & Translation Configuration Modal
**Trigger:** "New Translation" CTA in TopHeader & Hero banner
- 3-step configuration modal powered by Radix Dialog.
- File upload zone supporting `.mp4`, `.mov`, `.mkv` (≤500 MB) with dropzone preview.
- URL import tab for YouTube / external video inputs.
- Language selector supporting Indic & global languages with quick-pick badges.
- Advanced options: Dynamic Audio Duration, Background Noise Removal, Auto Subtitles.

---

### Step 3: Split-Screen Proofread Editor
**Route:** `/translate/[id]/proofread`
- Left 60%: Custom HTML5 dark video player with interactive timeline seeking.
- Right 40%: Scrollable transcript editor with editable segment blocks, auto-resizing textareas, and live sync between transcript timestamps and video playback.
- "Confirm & Render" export workflow triggering backend translation synthesis.

---

### Step 4: AI Backend Services & API Routes
**Routes:** `/api/translate/*`, `/api/cron/*`, `/api/webhooks/*`
- **Sarvam AI Integration:**
  - `/api/translate/transcribe`: Speech-to-text audio transcription pipeline.
  - `/api/translate/start`: Initiates full translation and voice synthesis workflows.
  - `/api/translate/generate`: Dubbed speech synthesis using Sarvam Indic voices.
  - `/api/cron/poll-sarvam`: Polling handler for asynchronous translation jobs.
- **HeyGen Lip-Sync Integration:**
  - `/api/webhooks/heygen`: Webhook callback receiver for lip-sync render status and video delivery.
- Secure server-side API key proxying preventing credentials from leaking to the client browser.

---

### Step 5: Supabase Authentication & Database Architecture
**Files:** `src/lib/supabase/*`, `src/app/(auth)/*`, `src/middleware.ts`, `supabase_schema.sql`
- Supabase SSR integration using `@supabase/ssr` with both server and browser clients.
- Authentication pages (Login, Auth callback handler with PKCE code exchange).
- Session validation middleware guarding protected dashboard routes.
- PostgreSQL database schema with Row Level Security (RLS) policies for user profiles, translation projects, and credit balances.

---

### Step 6: Codebase Cleanup & GitHub Repository
**Repository:** `https://github.com/favas1177/dubberband.git` (`main` branch)
- Cleaned up Git index and resolved `.gitignore` misconfiguration that previously staged a 234MB `.next` build cache.
- Successfully pushed the complete codebase to GitHub.

---

### Step 7: Migration from Cloudflare Tunnel to Vercel
- Diagnosed login loops and UI styling mismatch on `dubberband.eximgrowth.com`: DNS was pointing to an older stale deployment rather than the local tunnel.
- Terminated the local `cloudflared` tunnel in favor of a direct, production-grade Vercel deployment connected to GitHub.

---

## ⚠️ Known Issues, Current Errors & Remaining Blockers

### 1. Domain Ownership Verification Conflict (High Priority)
- **Error:** *"This domain is linked to another Vercel account. To use it with this project, add a TXT record at `_vercel.eximgrowth.com` to verify ownership."*
- **Cause:** The root domain `eximgrowth.com` was previously added to or verified under a different Vercel account.
- **Action Required:**
  1. Open Cloudflare DNS for `eximgrowth.com`.
  2. Add a `TXT` record:
     - **Name:** `_vercel` (resolves to `_vercel.eximgrowth.com`)
     - **Content / Value:** `vc-domain-verify=dubberband.eximgrowth.com,...` (copied from Vercel)
     - **TTL:** Auto
  3. Return to Vercel Domains tab and click **Refresh** / **Verify**.

---

### 2. Vercel Hobby Plan Cron Job Limitation
- **Error:** *"Hobby accounts are limited to daily cron jobs. This cron expression (* * * * *) would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel."*
- **Status:** Resolved in git commit `cdf8678` by removing `vercel.json` from the repository so builds are no longer blocked.
- **Action Required:**
  - Set up an external cron trigger (such as [cron-job.org](https://cron-job.org)) to send an HTTP GET request to:
    ```
    https://dubberband.eximgrowth.com/api/cron/poll-sarvam
    ```
    every 1 to 2 minutes so pending Sarvam audio jobs are polled and finalized automatically.

---

### 3. Vercel Framework Preset Detection ("public" folder error)
- **Error:** *"Error: No Output Directory named 'public' found after the Build completed."*
- **Cause:** When importing the Git repository, Vercel may default to "Other" instead of detecting Next.js.
- **Action Required:**
  - In Vercel Project Settings → **Build & Development Settings**, set **Framework Preset** explicitly to **Next.js**.

---

### 4. Vercel Environment Variables Configuration
- **Status:** Pending manual entry in Vercel dashboard.
- **Action Required:**
  Add the following 6 environment variables from `.env.local` to Vercel Project Settings → **Environment Variables**:
  1. `HEYGEN_API_KEY`
  2. `SARVAM_API_KEY`
  3. `NEXT_PUBLIC_SUPABASE_URL`
  4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  5. `SUPABASE_SERVICE_ROLE_KEY`
  6. `NEXT_PUBLIC_APP_URL` (set to `https://dubberband.eximgrowth.com`)

---

### 5. Supabase Auth Redirect URL Whitelist
- **Potential Blocker:** Authentication redirect loop on production if the callback URL is not whitelisted.
- **Action Required:**
  In the Supabase Dashboard → **Authentication** → **URL Configuration**:
  - Set **Site URL** to: `https://dubberband.eximgrowth.com`
  - Add to **Redirect URLs**:
    - `https://dubberband.eximgrowth.com/**`
    - `https://dubberband.eximgrowth.com/auth/callback`
    - `http://localhost:3000/**` (for local development)
