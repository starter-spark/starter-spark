# StarterSpark

Full-stack **EdTech + E-commerce platform** for selling STEM kits and delivering online courses. Built with Next.js 16, React 19, and Supabase. Includes learning management, community forum, Stripe payments, and admin dashboard.
---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Database** | Supabase (PostgreSQL), Row-Level Security |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI primitives |
| **Payments** | Stripe Checkout, Webhooks with idempotency |
| **Auth** | Supabase Auth (passwordless magic links) |
| **Email** | Resend (transactional emails) |
| **Analytics** | PostHog, Vercel Analytics, Vercel Speed Insights |
| **Monitoring** | Sentry (error tracking with source maps) |
| **Rate Limiting** | Upstash Redis (with in-memory fallback) |
| **Testing** | Playwright (E2E), Vitest (unit), axe-core (a11y) |
| **CI/CD** | GitHub Actions, Chromatic (visual regression) |
| **Security** | Semgrep SAST, ESLint security plugins |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  Next.js App Router │ React Server Components │ Zustand (cart)  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      Security Layer                             │
│  CSP Nonces │ Rate Limiting │ Input Validation │ RBAC Guards    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     Application Layer                           │
│  Server Actions │ API Routes │ Webhook Handlers │ Audit Logging │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      Data Layer                                 │
│  Supabase RLS │ 66+ RPC Functions │ Triggers │ Full-text Search │
└─────────────────────────────────────────────────────────────────┘
```

### Architectural Decisions

- **Server-first rendering** with React Server Components
- **Multi-layer authorization**: Proxy guards, then server action guards, then database RLS
- **Atomic database operations** prevent race conditions in license claiming and payments
- **Webhook deduplication** via database state tracking (handles Stripe retries)
- **License-gated content** enforced at the database level via RLS policies

---

## Features

### E-Commerce Platform
- Product catalog with inventory tracking and discount scheduling
- Shopping cart (Zustand with localStorage persistence)
- Stripe Checkout with webhook fulfillment
- License code generation using `crypto.randomBytes()`
- Guest purchase flow with email-based license claiming

### Learning Management System
- Courses containing modules containing lessons
- Multiple lesson types: content, code challenges, visual challenges, quizzes, projects
- **CodeMirror 6** code editor with Arduino/C++ and JavaScript support
- Progress tracking with XP, streaks, achievements, and leaderboards
- PDF certificate generation on course completion
- License-gated access (must own product to view lesson content)

### Community Forum
- Q&A posts with tags, product association, and status tracking
- Upvoting system with rate-limited interactions
- Nested comment threads
- Staff badges and verified answer marking
- Content moderation with flagging and ban system

### Admin Dashboard
- Product, license, and order management
- User management with role-based access (admin/staff/user)
- Content management system for site-wide text
- Course builder with drag-and-drop module/lesson ordering
- Event management with RSVP tracking
- Audit logging (tracks admin actions with IP/user-agent)
- Site banner scheduling

### Other
- Documentation system with hierarchical categories and full-text search
- Event calendar with type filtering (workshops, competitions, meetups)
- Contact form with file upload validation
- Newsletter subscription (Resend integration)
- Custom pages via markdown
- Easter eggs (Konami code, 418 teapot page, embedded Pong game)

---

## Security Implementation

### Security Layers

```
Request → CSP Nonce → Rate Limit → Auth Guard → RLS Policy → Response
```

| Layer | Implementation |
|-------|----------------|
| **Transport** | HSTS (1 year), upgrade-insecure-requests |
| **Content Security** | Per-request nonce, strict CSP directives |
| **Rate Limiting** | Endpoint-specific limits via Upstash Redis |
| **Authentication** | Supabase Auth with secure cookie handling |
| **Authorization** | RBAC guards + Row-Level Security policies |
| **Input Validation** | Type-safe validation, magic byte file detection |
| **Audit Trail** | Admin action logging with IP/UA capture |

### Security Headers (via proxy.ts)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [nonce-based, per-request]
```

### Row-Level Security

- **License immutability**: Trigger prevents modification of code, product_id, source after creation
- **Progress append-only**: Users cannot delete lesson completions
- **License-gated content**: `lesson_content` table accessible only to product owners
- **Ban enforcement**: RLS functions check `is_banned_from_forums()` on all mutations

### File Upload Security

- Magic byte detection (not just MIME headers)
- Embedded script scanning for XSS payloads
- File size limits per type (10MB images, 50MB videos)
- Deletes all files if any upload fails
- Random file paths (not guessable)

---

## Code Quality

### Static Analysis

- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint 9**: Flat config with security-focused plugins
  - `eslint-plugin-security`: Detects eval, unsafe regex, injection patterns
  - `eslint-plugin-no-secrets`: Prevents hardcoded credentials
- **Semgrep**: Daily SAST scans via GitHub Actions

### Testing

| Type | Framework | Coverage |
|------|-----------|----------|
| **Unit** | Vitest | Utility functions, validation logic |
| **E2E** | Playwright | User flows across all public pages |
| **API** | Playwright | Route handler behavior |
| **Accessibility** | axe-core | WCAG 2.1 AA compliance |
| **Visual** | Chromatic | UI regression detection |

### CI/CD Pipeline

```yaml
# Triggers: push/PR to development, daily schedule
Jobs:
  1. Build Next.js with caching
  2. Run Playwright E2E tests (2 retries, 120min timeout)
  3. Upload artifacts (reports, logs)

# Separate workflow: Semgrep security scanning (daily)
```

---

## Database Schema

### Core Tables (20+)

| Domain | Tables |
|--------|--------|
| **Users** | profiles, admin_audit_log |
| **Products** | products, product_media, product_tags |
| **Licenses** | licenses, stripe_checkout_fulfillments |
| **Learning** | courses, modules, lessons, lesson_content, lesson_progress |
| **Gamification** | achievements, user_achievements, learning_stats |
| **Community** | posts, comments, post_votes, comment_votes, post_reports |
| **Content** | doc_categories, doc_pages, site_content, site_banners |
| **Events** | events |

### RPC Functions (66+)

- `decrement_product_stock()` - Decrements stock without race conditions
- `award_achievement()` - Grants achievement (skips if already earned)
- `ban_user_from_forums()` / `unban_user_from_forums()` - Moderation
- `update_post_upvotes()` / `update_comment_upvotes()` - Recalculates vote counts
- `search_docs()` - Full-text search with ranking
- `increment_stat()` - Increments site-wide counters

### Triggers

- `handle_new_user()` - Profile creation on auth signup
- `generate_post_slug()` - Auto-generate URL-safe slugs
- `award_xp_on_lesson_completion()` - Adds XP when lesson marked complete
- `restrict_authenticated_license_updates()` - Blocks edits to license code/product/source fields
- `lock_down_lesson_progress_append_only()` - Prevents deleting progress records

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages with Header/Footer
│   │   ├── shop/           # E-commerce
│   │   ├── learn/          # Course viewer
│   │   ├── community/      # Forum
│   │   ├── workshop/       # Learning dashboard
│   │   └── account/        # User settings
│   ├── admin/              # Protected admin routes
│   ├── auth/               # Authentication pages
│   ├── api/                # Route handlers
│   └── actions/            # Shared server actions
│
├── components/
│   ├── ui/                 # shadcn/ui primitives (27 components)
│   ├── layout/             # Header, Footer, Sidebar
│   ├── commerce/           # ProductCard, CartSheet, BuyBox
│   ├── learn/              # CodeEditor, FlowEditor, Progress
│   ├── marketing/          # Hero, Differentiators, Spotlight
│   └── admin/              # DataTable, MediaUploader
│
├── lib/
│   ├── supabase/           # Database clients (server/client/admin)
│   ├── auth.ts             # RBAC guard functions
│   ├── rate-limit.ts       # Upstash + fallback implementation
│   ├── validation.ts       # License codes, tokens, formats
│   └── audit.ts            # Admin action logging
│
├── store/
│   └── cart.ts             # Zustand cart store
│
└── proxy.ts                # Auth middleware, CSP nonce generation
```

---

## Design System

Light mode only, slate + cyan color scheme.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `oklch(0.52 0.105 211)` / `#0e7490` | CTAs, focus rings |
| Background | Slate-50 | Page backgrounds |
| Foreground | Slate-900 | Primary text |
| Destructive | Amber-500 | Warnings, errors |
| Radius | 4px | Border radius for all components |

### Accessibility

- WCAG 2.1 AA compliant color contrast
- Semantic HTML structure (`<nav>`, `<main>`, `<section>`)
- ARIA attributes on all interactive elements
- Focus-visible rings (3px cyan offset)
- Keyboard navigation support
- `prefers-reduced-motion` respected

---

## API Routes

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/api/checkout` | POST | Create Stripe session | 10/min |
| `/api/webhooks/stripe` | POST | Payment fulfillment | - |
| `/api/claim-license` | POST | Claim by code | 5/min |
| `/api/claim-by-token` | POST | Claim by token | 5/min |
| `/api/learn/complete` | POST | Mark lesson done | - |
| `/api/certificate` | GET | Generate PDF | 10/10min |
| `/api/contact/upload` | POST | File attachments | 5/min |

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Component primitives
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Stripe](https://stripe.com/) - Payment processing
- [Vercel](https://vercel.com/) - Hosting and deployment