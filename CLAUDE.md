# CLAUDE.md — ContentRepurpose

## What This Is

A content repurposing pipeline for podcasters and YouTubers. The core value prop: "Upload your episode once. Get a week's worth of content back — posts, threads, quotes, newsletter drafts — in your voice, ready to publish."

This is NOT a ChatGPT wrapper with a text field. This is a workflow tool. The user uploads media, the system does the rest. The value is time saved, not AI output.

## Target Customer

**Solo podcasters and YouTubers with 500–50,000 followers.** They publish weekly or biweekly. They know they should be posting clips and quotes on social media but don't have time. They can't afford a VA or social media manager. They've tried doing it manually in ChatGPT and gave up after 2 weeks because it's tedious.

**Key insight:** These people are creators, not marketers. They want to hit "go" and review output, not craft prompts. They'll pay $19–29/month to get 3+ hours of their week back.

**Who this is NOT for:** Agencies managing 20 clients. Enterprise content teams. People who want a chatbot. If they need multi-client dashboards, they're not our customer.

## Product Name

**ContentRepurpose** (or **Repurpose.run** / **Clipflow** — pick what's available as domain)

## Conversion Strategy

- Free tier: 2 episodes/month, basic text repurposing (no scheduling, no style learning)
- Pro ($19/month): Unlimited episodes, style profiles, all platforms, export/download
- Growth ($39/month): Scheduling integration, team seats, priority processing
- CTA: "Upload your first episode free" — no credit card, instant value

## Language

**Everything in English.** UI, landing page, docs, error messages. Target market is English-speaking creators globally.

---

## The Pipeline (Core Product Logic)

This is what makes it a product, not a prompt:

```
INPUT: Audio file (.mp3, .wav, .m4a) or Video file (.mp4) or YouTube/Podcast URL
  ↓
STEP 1: Transcription (Whisper API or Deepgram)
  ↓
STEP 2: Analysis — extract key topics, quotes, arguments, stories, hooks
  ↓
STEP 3: Generate content pieces per platform:
  - Twitter/X: Thread (5-10 tweets) + 3-5 standalone tweets
  - LinkedIn: 2-3 long-form posts
  - Instagram: 3 caption drafts (for audiogram/reel captions)
  - Newsletter: 1 summary draft with key takeaways
  - Blog: 1 SEO-optimized blog post draft
  - YouTube Shorts/TikTok: Timestamp suggestions for clips worth cutting
  ↓
STEP 4: Apply user's style profile (tone, vocabulary, emoji usage, hashtag preferences)
  ↓
OUTPUT: Dashboard with all pieces, editable, copyable, downloadable
```

### Style Profiles (The Moat)

After the user processes 3-5 episodes, the system builds a style profile:
- Typical sentence length and structure
- Vocabulary patterns (formal vs casual, jargon usage)
- Hook patterns that they tend to use
- Emoji and hashtag habits
- Platform-specific tone differences

This is what ChatGPT can't do. A single prompt doesn't know that this user always opens LinkedIn posts with a question, never uses emojis on Twitter, and signs off newsletters with a specific catchphrase.

Store style profiles as structured data per user. Update incrementally with each processed episode.

---

## Design Direction

### What We're Going For

Think "creator tool" — clean, fast, focused on content. Like Descript or Riverside's UI: modern, not corporate, content-forward.

- **Light and airy, not dark.** Creators work in these tools during the day. Light theme default.
- **Content is the hero.** The generated posts should look like they'll look on the actual platform. Show Twitter posts in a tweet-shaped card, LinkedIn in a LinkedIn-shaped card.
- **Minimal chrome.** The UI should disappear. Upload → Output → Copy. As few clicks as possible.
- **Progress and momentum.** Show how much content was generated, how many pieces published. Creators are motivated by output volume.

### What We're NOT Going For

- Dark developer dashboard aesthetic
- Enterprise SaaS with complex navigation and settings pages
- "AI-powered" badges and sparkle emojis everywhere
- Cluttered feature-overloaded interfaces

### Color System

```css
:root {
  /* Backgrounds */
  --bg-primary: #FAFBFC;        /* Page background — near-white, easy on eyes */
  --bg-surface: #FFFFFF;         /* Cards, content areas */
  --bg-elevated: #F3F4F6;       /* Hover states, secondary surfaces */
  --bg-inverse: #111827;         /* Dark sections (footer, hero alt) */

  /* Text */
  --text-primary: #111827;       /* Headings, body */
  --text-secondary: #6B7280;     /* Muted text, labels */
  --text-muted: #9CA3AF;         /* Hints, placeholders */
  --text-inverse: #F9FAFB;       /* Text on dark backgrounds */

  /* Brand */
  --brand-primary: #7C3AED;      /* Purple — creative energy, stands out */
  --brand-primary-hover: #6D28D9;
  --brand-light: #EDE9FE;        /* Light purple for backgrounds */
  --brand-dark: #4C1D95;         /* Dark purple for emphasis */

  /* Semantic */
  --accent-success: #059669;     /* Published, complete */
  --accent-warning: #D97706;     /* Draft, needs review */
  --accent-danger: #DC2626;      /* Error, failed */
  --accent-info: #2563EB;        /* Links, info */

  /* Platform colors (for content preview cards) */
  --platform-twitter: #1DA1F2;
  --platform-linkedin: #0A66C2;
  --platform-instagram: #E4405F;
  --platform-youtube: #FF0000;
  --platform-newsletter: #059669;
  --platform-blog: #7C3AED;

  /* Border & Shadow */
  --border: #E5E7EB;
  --border-focus: #7C3AED;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.08);
}
```

**Why purple as brand color:** It's associated with creativity, stands out in a sea of blue SaaS tools, and it's not used by any major competitor in this space (Castmagic is blue, Opus is dark, Repurpose.io is green).

### Typography

- Headings: **"Cal Sans"** or **"Satoshi"** — modern, geometric, has personality without being loud
- Body: **"Inter"** — clean, readable, proven
- Monospace/Data: **"JetBrains Mono"** — for stats, timestamps, counts

### Landing Page Structure

**Section 1 — Hero**
- Headline: "One episode. A week of content." or "Stop wasting hours turning episodes into posts."
- Subline: "Upload your podcast or video. Get ready-to-publish posts for Twitter, LinkedIn, Instagram, and your newsletter — in your voice."
- CTA: "Upload your first episode free"
- Visual: Animated or static graphic showing one audio waveform splitting into multiple platform cards. NOT a screenshot of the dashboard.

**Section 2 — The Problem**
- "You publish great episodes. Then what?" Show the pain: manual transcription, writing posts from scratch, copy-pasting between tabs, giving up after week 2.
- Keep it short. 3 sentences max.

**Section 3 — How It Works**
- Step 1: Upload (drag & drop, paste URL)
- Step 2: Review (AI generates, you edit)
- Step 3: Publish (copy, download, or schedule)
- Each step with a clean visual/mockup

**Section 4 — Output Preview**
- Show actual example output: a tweet thread, a LinkedIn post, a newsletter snippet. Make them look real, platform-accurate. This section sells the product more than any feature list.

**Section 5 — Pricing**
- Two plans. Simple. No feature matrix with 30 rows.

**Section 6 — FAQ + Footer**
- "Is this just ChatGPT?" — address it directly. "No. ChatGPT doesn't know your voice, can't process audio, and can't produce platform-ready content in one click."

---

## Technical Architecture

### Stack
- **Framework:** Next.js 15, App Router, TypeScript strict
- **Styling:** Tailwind CSS with semantic design tokens (see color system)
- **Database:** Prisma + PostgreSQL
- **Auth:** NextAuth v5, JWT strategy, credentials + Google OAuth
- **AI:** OpenAI SDK (Whisper for transcription, GPT-4o for content generation)
- **File Storage:** S3-compatible (Cloudflare R2 or MinIO on VPS — cheap, self-hosted)
- **Background Jobs:** BullMQ + Redis (for processing pipeline — transcription takes time)
- **Payments:** Stripe (checkout + webhooks)
- **Email:** Resend (transactional only)
- **Hosting:** Self-hosted VPS (existing infrastructure)

### Key Technical Decisions

**Why background jobs:** Transcribing a 60-minute episode takes 1-3 minutes. Content generation takes another 30-60 seconds. This can't be a synchronous API call. Upload → queue job → process → notify user when done.

**Why S3/R2 for files:** Audio files are 50-200MB. Don't store in DB. Presigned uploads from client → S3/R2, then worker picks up the file for processing.

**Why not Vercel:** Large file uploads + long-running background jobs don't work well on serverless. VPS is the right choice here.

### Database Schema (Core Models)

```
User
  - id, email, name, passwordHash
  - stripeCustomerId, subscriptionTier, subscriptionStatus
  - createdAt, updatedAt

StyleProfile
  - id, userId (unique — one per user)
  - tone (formal/casual/mixed)
  - vocabulary (JSON — common phrases, avoided words)
  - hookPatterns (JSON — how they open posts)
  - platformPreferences (JSON — per-platform settings)
  - sampleCount (how many episodes contributed)
  - updatedAt

Episode
  - id, userId
  - title, description
  - sourceType (upload/youtube_url/podcast_url)
  - sourceUrl (if URL)
  - fileKey (S3 key if uploaded)
  - transcription (text, stored after processing)
  - status (uploading/transcribing/analyzing/generating/complete/failed)
  - duration (seconds)
  - processedAt, createdAt

ContentPiece
  - id, episodeId, userId
  - platform (twitter/linkedin/instagram/newsletter/blog/tiktok)
  - type (thread/post/caption/draft/timestamps)
  - content (text)
  - status (generated/edited/copied/published)
  - order (for threads — tweet 1, tweet 2, etc.)
  - createdAt, updatedAt
```

### API Routes

```
POST   /api/auth/register
POST   /api/auth/[...nextauth]

POST   /api/episodes              — create episode (upload or URL)
GET    /api/episodes              — list user's episodes
GET    /api/episodes/[id]         — episode detail + content pieces
DELETE /api/episodes/[id]         — delete episode and content
POST   /api/episodes/[id]/reprocess — regenerate content

GET    /api/content/[episodeId]   — get all content pieces for episode
PATCH  /api/content/[id]          — edit a content piece
POST   /api/content/[id]/copy     — track copy action (for analytics)

GET    /api/style-profile         — get user's style profile
PUT    /api/style-profile         — update/override style preferences

POST   /api/upload/presign        — get presigned S3/R2 upload URL

POST   /api/billing/checkout
POST   /api/billing/webhook
GET    /api/billing/status
```

### File Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated app shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Episode list + stats
│   │   │   ├── episodes/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Episode detail + content pieces
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Upload page
│   │   │   ├── style/
│   │   │   │   └── page.tsx      # Style profile settings
│   │   │   └── billing/
│   │   │       └── page.tsx
│   │   └── layout.tsx            # App shell with nav
│   ├── api/                      # API routes (see above)
│   ├── login/
│   ├── register/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── content/                  # Content piece cards, platform previews
│   ├── episodes/                 # Episode list, upload form
│   ├── layout/                   # Nav, sidebar, shell
│   ├── landing/                  # Landing page sections
│   └── ui/                       # Shared primitives (button, input, etc.)
├── lib/
│   ├── ai/
│   │   ├── transcribe.ts         # Whisper integration
│   │   ├── analyze.ts            # Extract topics, quotes, hooks
│   │   ├── generate.ts           # Generate platform content
│   │   └── style.ts              # Style profile analysis + application
│   ├── storage/
│   │   ├── s3.ts                 # S3/R2 client + presigned URLs
│   │   └── upload.ts             # Upload handling
│   ├── jobs/
│   │   ├── queue.ts              # BullMQ setup
│   │   └── process-episode.ts    # Full pipeline worker
│   ├── billing/
│   ├── prisma.ts
│   └── auth-context.ts
├── auth.ts
└── middleware.ts
```

---

## Implementation Priorities

### Priority 1: Upload + Transcription Pipeline
The foundation. Without this, nothing works.
- Presigned upload to S3/R2 (or local MinIO)
- BullMQ worker that picks up uploaded files
- Whisper API transcription
- Store transcription in Episode model
- Simple status UI: uploading → transcribing → done
- Support YouTube URL input (use yt-dlp or similar to extract audio)

### Priority 2: Content Generation
The core value.
- Take transcription, analyze for key segments
- Generate content pieces per platform (Twitter thread, LinkedIn posts, newsletter draft, blog draft)
- System prompt must be specific: "You are a content strategist for podcasters. Extract the most engaging, shareable moments..."
- Store as ContentPiece records linked to Episode
- Display in dashboard grouped by platform with platform-styled preview cards

### Priority 3: Landing Page
Now that the product works, sell it.
- Build following the design direction above
- All English
- Mobile responsive
- Include real example output (generate from a public podcast episode)
- Pricing section with Stripe integration

### Priority 4: Style Profiles
The moat / differentiator.
- After 3+ episodes processed, analyze the user's edited outputs
- Build a style profile: tone, hook patterns, vocabulary
- Apply style profile to all future generation
- Let user override/tweak manually in settings

### Priority 5: Edit + Export Flow
Polish the output experience.
- Inline editing of any content piece
- One-click copy to clipboard
- Bulk download as .txt or .md grouped by platform
- Mark pieces as "used" / "published" for tracking

### Priority 6: Billing
Gate the value.
- Free: 2 episodes/month, basic platforms (Twitter + LinkedIn only)
- Pro: Unlimited, all platforms, style profiles
- Stripe checkout + webhook (same pattern as SafeSite)

---

## AI Prompt Architecture

### Transcription
Use Whisper API directly. No special prompting needed. Store raw transcription with timestamps.

### Analysis Prompt (Step 2)
```
System: You are a content analyst for podcast episodes. Your job is to identify the most engaging, shareable, and valuable segments from a transcript.

Extract:
1. KEY_QUOTES: Direct quotes that are punchy, insightful, or controversial (include timestamps)
2. STORIES: Personal anecdotes or case studies that would resonate on social media
3. ARGUMENTS: Strong opinions or frameworks the speaker presents
4. HOOKS: Potential opening lines for social posts based on the content
5. TAKEAWAYS: Core lessons or actionable advice

Return as structured JSON. Be selective — quality over quantity. A 60-minute episode should yield 8-12 key segments, not 50.
```

### Generation Prompt (Step 3 — per platform)
```
System: You are a social media content writer for podcasters. Generate platform-specific content from podcast segments.

Rules:
- Twitter: Short, punchy. Threads should tell a story with a hook in tweet 1. No hashtags unless the user's style includes them.
- LinkedIn: Professional but personal. Open with a hook (question, bold statement, or story). 150-300 words. Line breaks for readability.
- Newsletter: Conversational summary. Include key quotes. End with a CTA to listen to the full episode.
- Blog: SEO-friendly. 800-1200 words. Include headings. Link back to the episode.

CRITICAL: Match the speaker's voice. They said these things — the posts should sound like them, not like a marketing agency. Use their vocabulary, their level of formality, their energy.

{If style_profile exists: Apply these style preferences: [style_profile_json]}
```

### Style Analysis Prompt (Step 4 — after 3+ episodes)
```
System: Analyze the following collection of edited social media posts by this creator. Identify their writing patterns.

Return structured JSON:
{
  "tone": "casual" | "professional" | "mixed",
  "formality_score": 1-10,
  "average_sentence_length": number,
  "common_hooks": ["question", "bold_claim", "story_opening", ...],
  "vocabulary_preferences": ["words they use often"],
  "vocabulary_avoidances": ["words they never use"],
  "emoji_usage": "none" | "minimal" | "moderate" | "heavy",
  "hashtag_usage": "none" | "minimal" | "platform_specific",
  "signature_patterns": ["any recurring phrases or sign-offs"],
  "platform_differences": { "twitter": {...}, "linkedin": {...} }
}
```

---

## Code Conventions

- **TypeScript strict** — no `any`, no implicit returns
- **Server Components by default** — `"use client"` only when needed
- **Zod validation** on all API inputs
- **Error handling:** API routes return `{ error: string }` with HTTP status. AI calls always have fallbacks.
- **Auth pattern:** Always use `getCurrentUserContext()` in API routes. Never trust JWT alone.
- **File naming:** kebab-case for files, PascalCase for components
- **Imports:** Use `@/` path alias

## What NOT To Do

- Don't add features not in the priority list
- Don't build a chat interface — this is a pipeline, not a conversation
- Don't add social media API integrations yet (posting directly to Twitter etc.) — that's Phase 2, after validation
- Don't over-engineer the style profiles before the basic pipeline works
- Don't add team/collaboration features yet
- Don't build a mobile app — responsive web is fine
- Don't add analytics dashboards with charts — a simple "X episodes processed, Y pieces generated" counter is enough
- Don't use dark theme — light theme only
- Don't add AI-related buzzwords to the UI ("Powered by AI", sparkle icons, "AI-generated")

---

# SKILLS

## Skill: Frontend Governance

### Design Philosophy

Clean, content-forward, creator-friendly. Every element earns its place. The generated content is the hero — the UI is invisible infrastructure around it.

### Semantic Token System

All styling MUST use the project's semantic tokens defined in `globals.css`. Direct color values (`bg-gray-900`, `#1a1a1a`, `text-white`) are forbidden.

#### Background Layers

| Token           | Usage                          | Tailwind Class    |
|-----------------|--------------------------------|-------------------|
| `--bg-primary`  | Page background                | `bg-primary`      |
| `--bg-surface`  | Cards, content areas           | `bg-surface`      |
| `--bg-elevated` | Hover, secondary surfaces      | `bg-elevated`     |
| `--bg-inverse`  | Dark sections (footer, hero)   | `bg-inverse`      |

#### Text Hierarchy

| Token              | Usage                    | Tailwind Class       |
|--------------------|--------------------------|----------------------|
| `--text-primary`   | Headings, body           | `text-primary`       |
| `--text-secondary` | Labels, muted            | `text-secondary`     |
| `--text-muted`     | Hints, placeholders      | `text-muted`         |
| `--text-inverse`   | Text on dark backgrounds | `text-inverse`       |

#### Brand & Semantic Colors

| Token               | Usage                    | Tailwind Class        |
|----------------------|--------------------------|-----------------------|
| `--brand-primary`    | CTAs, links, brand       | `text-brand` / `bg-brand` |
| `--accent-success`   | Published, complete      | `text-success`        |
| `--accent-warning`   | Draft, needs review      | `text-warning`        |
| `--accent-danger`    | Error, failed            | `text-danger`         |

#### Platform Colors

| Token                  | Usage                | Tailwind Class         |
|------------------------|----------------------|------------------------|
| `--platform-twitter`   | Twitter preview cards | `bg-platform-twitter`  |
| `--platform-linkedin`  | LinkedIn previews     | `bg-platform-linkedin` |
| `--platform-instagram` | Instagram previews    | `bg-platform-instagram`|
| `--platform-youtube`   | YouTube previews      | `bg-platform-youtube`  |

### Forbidden Patterns (Anti-Slop)

These indicate AI-generated generic design. Reject them:

**Visual:**
- Decorative gradient backgrounds without purpose
- Excessive border-radius on every element
- Layered box-shadows for fake "depth"
- Abstract SVG illustrations or blob shapes
- Sparkle/magic-wand icons next to AI features

**Color:**
- Hardcoded values: `bg-gray-900`, `text-white`, `#hex`, `rgb()`, `hsl()`
- Tailwind palette direct: `bg-blue-500`, `text-slate-400`
- Opacity hacks: `bg-black/50`

**Layout:**
- Nested flex containers without clear hierarchy
- Magic number spacing: `mt-[47px]`, `w-[312px]`
- Three-card feature grids as the default section layout

**Typography:**
- Arbitrary text sizes without hierarchy
- Everything bold for emphasis
- Default line heights on dense text

### Content Preview Cards

Generated content pieces MUST be displayed in platform-accurate preview cards:
- Twitter card: Rounded, light bg, avatar placeholder, character count, thread numbering
- LinkedIn card: White bg, subtle border, name/headline area, engagement placeholders
- Newsletter: Email-style preview with subject line
- Blog: Article-style with title, reading time, excerpt

These cards make the output feel real and publishable. They're the core UI element of the product.

### Component Guidelines

- Server Components by default
- Client components: `"use client"` + import `client-only`
- Use shadcn/ui primitives where available (Button, Input, Dialog, etc.)
- All interactive elements need visible focus states using `--border-focus`

---

## Skill: SEO

### Technical SEO Baseline

Every page must have:
- Unique `<title>` and `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:image`)
- Canonical URL
- Semantic HTML (`<main>`, `<article>`, `<section>`, `<nav>`)

### Implementation

- Use Next.js `metadata` export in page files (not manual `<head>` tags)
- `robots.ts` at app root — allow indexing of landing page, block dashboard
- `sitemap.ts` at app root — include landing page, pricing, login/register
- Landing page content should target keywords: "repurpose podcast content", "podcast to social media", "turn episodes into posts"

### Performance

- Images: Use `next/image` with proper `width`/`height` and `priority` on above-fold
- Fonts: Preload via `next/font` — no external Google Fonts requests
- No layout shift: All dynamic content has defined dimensions
- Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Landing Page SEO

- H1: One per page, contains primary keyword
- Content structure: H1 → H2 sections → H3 subsections
- Internal links: Landing → Login, Landing → Register, Landing → Pricing
- External links: Open in new tab with `rel="noopener noreferrer"`
- Schema markup: `SoftwareApplication` JSON-LD on landing page
