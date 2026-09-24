# Project: Dubberband
**Description:** A white-labeled AI video translation SaaS. 
**Design Inspiration:** Exact UI/UX clone of HeyGen's Video Translation flow, but using a custom color palette (Indigo/Teal).

## 🛠 Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui & Radix UI (accessible, unstyled components)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React

## 🎨 Design System (HeyGen Aesthetic)
- **Primary Colors:** Deep Indigo and Teal (replacing HeyGen's purple).
- **Layout:** Dashboard-centric, fixed left sidebar, top header, clean grid layouts.
- **Components:** Spacious padding, slightly rounded corners (`rounded-xl`), minimal borders, subtle shadows. Dark mode for video players, clean light mode for transcript editors.

## 🚀 Core Workflows
1. **Dashboard:** Displays user credits, navigation, and a grid of recent translation projects with status badges (Processing, Completed, Draft).
2. **Translation Ingestion:** A modal/page to upload MP4s or paste YouTube URLs. Includes Source/Target language selection and advanced toggles (Dynamic Duration, Remove Noise).
3. **The "Two Options" Action:** Users choose either "1-Click Translate" (auto-generates) or "Proofread Script" (goes to editor).
4. **Proofread Editor (Split Screen):** 
   - Left: Source video player.
   - Right: Interactive transcript editor (timestamps + editable text areas) to fix translations before finalizing.

## 🔒 Backend API Boundaries (Proxy)
- The frontend must NEVER communicate directly with 3rd-party APIs.
- **External Services Used (White-labeled):** 
  - *Sarvam AI* (for translation & TTS).
  - *HeyGen API Pay-As-You-Go* (for lip-sync video generation).
- Create Next.js Route Handlers (`/api/translate/...`) to proxy these requests, securely holding API keys in `.env.local` and returning generic "Dubberband" responses.

## 📋 Implementation Steps
- [ ] Step 1: App Shell & Dashboard Layout.
- [ ] Step 2: Upload & Translation Configuration Modal.
- [ ] Step 3: Split-Screen Proofread Editor.
- [ ] Step 4: Next.js API Proxy Routes.