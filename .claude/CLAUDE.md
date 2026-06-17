# Master Configuration

---

## Project Overview

**Gorilla Guardians HandCrafts** — A React + TypeScript e-commerce and tourism platform supporting Rwandan artisans and gorilla conservation. The app enables users to browse and purchase authentic handcrafts via Shopify, book cultural experiences and events, and supports three languages (English, French, Kinyarwanda). Deployable as a PWA and native iOS/Android via Capacitor.

### Purpose 
Artisans and conservation-minded travellers use this platform to discover Rwandan handcrafts, book local cultural experiences, and learn about gorilla conservation impact. Revenue supports both artisan livelihoods and conservation efforts.

---

## Project-Specific Context

### Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| UI Framework | React 18.3 + TypeScript | Strict mode; component-based SPA |
| Build Tool | Vite 5.4 | Dev server on port 8080; SWC compilation |
| Styling | Tailwind CSS 3.4 + shadcn/ui | All colors via HSL CSS vars in `index.css` |
| Routing | React Router 6.30 | Client-side SPA routing in `App.tsx` |
| Client State | Zustand 5.0 | Cart store with localStorage persistence |
| Server State | TanStack React Query 5.83 | Products, experiences — caching + stale-while-revalidate |
| Forms | React Hook Form 7.61 + Zod 3.25 | Schema validation on all user input |
| Products / Checkout | Shopify Storefront API v2025-07 | GraphQL; credentials in `src/lib/shopify.ts` |
| Auth + DB | Supabase | PostgreSQL backend + Supabase Auth (email/password) |
| Mobile | Capacitor 7.4 | iOS/Android native bridge |
| i18n | Custom LanguageContext | en / fr / rw — persisted to localStorage |
| PWA | vite-plugin-pwa | Service worker; 30-day image cache for Shopify CDN |

### Directory Structure
```
gorilla-guardians-source/
├── src/
│   ├── components/          # Shared UI components (Navbar, ProductCard, CartDrawer, Hero, Impact, etc.)
│   ├── pages/               # Route-level views (Index, ProductDetail, Experiences, Events, Auth, Dashboard)
│   ├── contexts/            # LanguageContext — i18n provider
│   ├── hooks/               # useAuth (Supabase), useUserRole, use-mobile, use-toast
│   ├── stores/              # cartStore.ts — Zustand cart with Shopify checkout sync
│   ├── integrations/        # supabase/client.ts — Supabase client singleton
│   ├── lib/                 # shopify.ts — Shopify Storefront GraphQL client + queries
│   ├── assets/              # Static images and icons
│   ├── App.tsx              # Root component: React Router routes + provider tree
│   ├── main.tsx             # Vite entry point
│   └── index.css            # Design tokens — all HSL CSS custom properties
├── .claude/                 # Claude config (hooks, skills, agents, settings)
├── public/                  # PWA manifest, icons
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite + PWA plugin configuration
├── tsconfig.json            # TypeScript strict config
├── components.json          # shadcn/ui configuration
└── tailwind.config.ts       # Tailwind + CSS var token mappings
```

### Key Data Flows
| Flow | Path |
|------|------|
| Products | Shopify Storefront API → React Query → `ProductGrid` / `ProductDetail` |
| Cart | Add to cart → Zustand `cartStore` → `CartDrawer` → Shopify checkout URL |
| Auth | Supabase Auth → `useAuth` hook → `Auth` page / `Dashboard` |
| Language | `LanguageContext` → `useLanguage` hook → `t(key, {en, fr, rw})` helper |
| Experiences/Events | Supabase tables → React Query → `Experiences` / `Events` pages |

### Routes & Pages
| Route | Page Component | Auth | Purpose |
|-------|---------------|------|---------|
| `/` | `Index` | None | Homepage — Hero, ProductGrid, Experiences, Events, Impact |
| `/product/:handle` | `ProductDetail` | None | Shopify product detail + add-to-cart |
| `/experiences` | `Experiences` | None | Cultural experience listing |
| `/experience/:id` | `ExperienceDetail` | None | Experience detail + booking |
| `/events` | `Events` | None | Events listing |
| `/event/:id` | `EventDetail` | None | Event detail |
| `/dashboard` | `Dashboard` | Required | User account dashboard |
| `/auth` | `Auth` | None | Supabase login / signup |
| `/install` | `Install` | None | PWA install instructions |

### State Architecture
| Layer | Tool | Scope |
|-------|------|-------|
| UI state | React `useState` / `useReducer` | Component-local |
| Cart state | Zustand + localStorage | Global, persisted |
| Server/async data | TanStack React Query | Global, cached |
| Auth state | Supabase session in `useAuth` | Global |
| Preferences | localStorage | Persisted (language, cart) |

### i18n Pattern
```tsx
// Every user-facing string uses this helper:
const { t } = useLanguage();
t('hero.title', { en: 'Authentic Crafts', fr: 'Artisanat Authentique', rw: 'Ubuhanga Nyakuri' })
```

---

## Known Issues & Technical Debt

These are confirmed issues — treat as PRIORITY targets when any related code is touched:

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **Critical** | Shopify Storefront access token hardcoded as string literal | `src/lib/shopify.ts` |
| 2 | **Critical** | Shopify store domain hardcoded as string literal — should be `VITE_SHOPIFY_STORE_DOMAIN` | `src/lib/shopify.ts` |
| 3 | **High** | No React error boundary wrapping route-level components — unhandled render errors crash entire app | `src/App.tsx` |
| 4 | **High** | Cart store loads from localStorage on startup without re-validating against Shopify — stale/deleted items possible | `src/stores/cartStore.ts` |
| 5 | **High** | Shopify API version `2025-07` hardcoded inline — not centralised as a named constant | `src/lib/shopify.ts` |
| 6 | **Medium** | `useAuth` hook does not handle Supabase session expiry gracefully — expired sessions silently fail | `src/hooks/useAuth.tsx` |
| 7 | **Medium** | Language fallback defaults to `'en'` unconditionally — no detection of `navigator.language` | `src/contexts/LanguageContext.tsx` |
| 8 | **Medium** | No loading/skeleton state on `ProductDetail` page during Shopify query — blank flash on first load | `src/pages/ProductDetail.tsx` |
| 9 | **Low** | PWA cache strategy caches Shopify CDN images for 30 days — stale images if product photos updated | `vite.config.ts` |
| 10 | **Low** | No `<title>` or `<meta description>` updates on route changes — all pages share the same static title | `src/App.tsx` |

---

## Environment Setup
```
# .env.local (these MUST be env vars — do not hardcode):
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_ACCESS_TOKEN=your-storefront-access-token
```
Note: `src/lib/shopify.ts` and `src/integrations/supabase/client.ts` currently hardcode or inline these values. Any code change touching these files must migrate to `import.meta.env.VITE_*`.

---

## Skill Priority Guidance for This Project

When the 4-phase pipeline runs on this codebase, route these skill modules with elevated priority:

- **`secrets-management-audit.md`** — Shopify credentials hardcoded in source are confirmed Critical findings
- **`api-and-infrastructure.md`** — Shopify Storefront API CORS, rate limits, and error surfacing to the client
- **`authentication-flow-review.md`** — Supabase session lifecycle; token refresh and expiry handling
- **`authorization-implmentation.md`** — `useUserRole` hook and route-level guards for `/dashboard`
- **`input-validation.md`** — Zod schemas on checkout, auth, and booking forms
- **`performance-analysis.md`** — TanStack Query cache config, cart re-renders, Shopify GraphQL query depth
- **`resilience-fault-tolerance.md`** — Shopify API and Supabase offline/timeout failure paths

---

## Execution Model

Skills are domain-expert engines. Hooks are orchestrators. Claude is the executor.

Skills are NEVER invoked directly. They are always invoked through the hook that owns that phase.

---

## Mandatory 4-Phase Execution Order

### PHASE 1 — Pre-Analysis (before writing any code)
Invoke: `.claude/hooks/pre-hook.md`

The pre-hook will delegate to:
- `.claude/skills/code-quality/initial-software-design-analyis.md`
- `.claude/skills/security/initial-security-analysis.md`
- Any early-risk skill modules identified by the domain routing table

Output required: architecture summary + activated skill list + risk flags.
Do NOT write code until this phase is complete.

### PHASE 2 — Code Generation (while writing code)
Invoke: `.claude/hooks/during-hook.md`

The during-hook routes to skill modules based on the type of code being written.
If a skill raises a violation: STOP, report, wait for resolution before continuing.

### PHASE 3 — Post-Analysis (after generating code)
Invoke: `.claude/hooks/post-hook.md`

The post-hook runs all skill modules across both domains in a defined order,
aggregates findings, enforces the approval gate, and writes a report to `audits/`.

NEVER skip Phase 3. NEVER skip the approval gate inside it.

### PHASE 4 — Test Generation (after Phase 3 approval gate is cleared)
Invoke: `.claude/hooks/test-hook.md`

The test-hook:
1. Reads Phase 3 audit output from `audits/` — Critical/High findings become PRIORITY test targets
2. Delegates to `.claude/skills/tests/security-test-cases.md` for all 13 security domains
3. Delegates to `.claude/skills/tests/code-quality-test-cases.md` for all 12 quality domains
4. Builds a coverage matrix, tiered execution plan, and traceability matrix
5. Writes a single comprehensive professional test plan to `tests/test-plan-[YYYY-MM-DD].md`

Phase 4 is optional when no new code was written (analysis-only sessions).
Phase 4 is MANDATORY whenever Phase 3 produces findings or new code is generated.

---

## Skill Registry

### Security Skills — `.claude/skills/security/`
| File | Domain |
|------|--------|
| `initial-security-analysis.md` | Entry-point + surface mapping |
| `authentication-flow-review.md` | Auth, tokens, session management |
| `session-cookie-security.md` | Session config, cookies, CSRF |
| `authorization-implmentation.md` | RBAC, BOLA/IDOR, middleware order |
| `input-validation.md` | XSS, injection, schema validation |
| `ssrf-and-open-redirect.md` | SSRF (OWASP A10), open redirect |
| `database-security.md` | Supabase RLS, query safety, connection pools |
| `secrets-management-audit.md` | Hardcoded secrets, env vars, key rotation |
| `security-misconfiguration.md` | Headers, debug mode, defaults (OWASP A05) |
| `logging-monitoring.md` | PII in logs, security events, audit trails |
| `business-logic-vulnerabilities.md` | Race conditions, cart manipulation, TOCTOU |
| `api-and-infrastructure.md` | CORS, rate limiting, HTTP headers, error handling |
| `file-handling-business-logic.md` | File upload, MIME validation, path sanitization |
| `dependency-supply-chain.md` | CVEs, typosquatting, integrity (OWASP A06) |
| `comprehensive-security-report.md` | Final synthesis — invoked last in post-hook |

### Code Quality Skills — `.claude/skills/code-quality/`
| File | Domain |
|------|--------|
| `initial-software-design-analyis.md` | Architecture, patterns, anti-patterns |
| `solid-principles.md` | SRP, OCP, LSP, ISP, DIP compliance |
| `design-pattern-implmentation.md` | Creational, structural, behavioral patterns |
| `code-quality-metrics-standards.md` | Cyclomatic/cognitive complexity, LOC, coupling |
| `code-duplication-detection.md` | DRY violations, structural duplicates |
| `readability-and-naming.md` | Naming conventions, magic numbers, clarity |
| `error-handling-resilience.md` | Error boundaries, async errors, categories |
| `exception-flow-analysis.md` | Error propagation, swallowed exceptions |
| `resilience-fault-tolerance.md` | Retries, timeouts, fallbacks |
| `performance-analysis.md` | Re-renders, query efficiency, bundle size |
| `dependency-management.md` | Outdated packages, bloat, lock files, licenses |
| `testing-implementation.md` | Coverage, test pyramid, missing edge cases |

### Test Skills — `.claude/skills/tests/`
| File | Domain |
|------|--------|
| `security-test-cases.md` | Concrete test cases for all 13 security skill domains |
| `code-quality-test-cases.md` | Concrete test cases for all 12 code-quality skill domains |

### Hooks — `.claude/hooks/`
| File | Phase | Trigger |
|------|-------|---------|
| `pre-hook.md` | 1 — Pre-Analysis | Before writing any code |
| `during-hook.md` | 2 — Code Generation | While writing code |
| `post-hook.md` | 3 — Post-Analysis | After generating code |
| `test-hook.md` | 4 — Test Generation | After Phase 3 approval gate |

---

## Rules

- NO ASSUMPTIONS — if a user's request or prompt has unclear, incomplete, or ambiguous requirements for a change, do NOT guess intent or fill gaps silently. STOP and ask the user a clarifying question before making any change. See [Memory: No Assumptions Policy](../.agents/memory/no-assumptions-policy.md).
- HOOKS ARE ORCHESTRATORS ONLY — they route to skills, never analyze directly.
- SKILLS ARE DOMAIN-EXPERT ENGINES — all findings come from skills.
- If context is missing for any skill: say "Unable to verify — [reason]" and request the file.
- Phase 3 post-analysis is mandatory. The approval gate inside it is mandatory.
- Phase 4 test generation is mandatory when new code is generated or Phase 3 produces findings.
- All audit reports are written to the `audits/` folder.
- All test plans are written to the `tests/` folder as `test-plan-[YYYY-MM-DD].md`.
