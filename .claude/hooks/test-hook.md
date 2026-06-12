# TEST-HOOK — Orchestrator (Phase 4: Test Generation)

ROLE: Orchestrator only. Do NOT write test assertions directly.
Delegate all test case derivation to the test skill modules below.
Synthesize their output into a single comprehensive professional test document.

Runs AFTER post-hook.md (Phase 3) is complete.
If Phase 3 audit output exists in `audits/`, load it — findings become priority test targets.

---

## STEP 1 — Load Context

1. If `audits/` folder contains recent audit reports, read them.
   - Every finding with severity Critical or High becomes a MANDATORY test case.
   - Medium findings become RECOMMENDED test cases.
   - Low findings become OPTIONAL test cases.

2. Identify the tech stack from pre-hook output or by reading:
   - `package.json` / `package-lock.json`
   - `vite.config.ts` — confirms Vite + vite-plugin-pwa setup
   - Determine testing frameworks in use:
     - Unit / Component: Vitest + React Testing Library
     - E2E: Playwright (if configured) or manual verification steps
     - Static analysis: ESLint + TypeScript `tsc --noEmit`

3. Identify all routes (`src/App.tsx`), custom hooks (`src/hooks/`), stores (`src/stores/`),
   and Shopify / Supabase integration points to cover.

---

## STEP 2 — Security Test Case Generation

Invoke: `.claude/skills/tests/security-test-cases.md`

For each test case in that skill:
- Adapt to actual route paths, component names, hook names, and auth mechanisms in this codebase
- Mark test cases that directly map to a Phase 3 audit finding as PRIORITY
- For each test case, produce:
  - Concrete test code scaffold (Vitest + React Testing Library for unit/component; Playwright for E2E)
  - Or manual verification steps if automation is not feasible

Generate test cases for ALL 13 security domains:
  [ ] authentication-flow-review
  [ ] session-cookie-security
  [ ] authorization-implmentation
  [ ] input-validation
  [ ] ssrf-and-open-redirect
  [ ] database-security
  [ ] secrets-management-audit
  [ ] security-misconfiguration
  [ ] logging-monitoring
  [ ] business-logic-vulnerabilities
  [ ] api-and-infrastructure
  [ ] file-handling-business-logic
  [ ] dependency-supply-chain

---

## STEP 3 — Code Quality Test Case Generation

Invoke: `.claude/skills/tests/code-quality-test-cases.md`

For each test case in that skill:
- Map to concrete files, component names, hook names, and line numbers in `src/`
- Mark test cases that directly fix a Phase 3 quality finding as PRIORITY

Generate test cases for ALL 12 code quality domains:
  [ ] initial-software-design-analyis (architecture)
  [ ] solid-principles
  [ ] design-pattern-implmentation
  [ ] code-quality-metrics-standards
  [ ] code-duplication-detection
  [ ] readability-and-naming
  [ ] error-handling-resilience
  [ ] exception-flow-analysis
  [ ] resilience-fault-tolerance
  [ ] performance-analysis
  [ ] dependency-management
  [ ] testing-implementation

---

## STEP 4 — Test Coverage Matrix

Build a matrix mapping every skill domain to test types that cover it:

| Domain | Unit | Component | Integration | E2E | Static/CI | Manual |
|--------|------|-----------|-------------|-----|-----------|--------|
| (auto-populate from Steps 2 and 3)

Mark each cell: COVERED | PARTIAL | GAP

---

## STEP 5 — Test Execution Plan

Produce a prioritized execution plan:

### Tier 1 — Automated CI (runs on every PR)
- TypeScript type check: `npx tsc --noEmit`
- ESLint: `npm run lint`
- Unit + component tests: `npx vitest run`
- Secrets scan: grep / gitleaks for hardcoded `VITE_` values or API key patterns
- Dependency audit: `npm audit --audit-level=high`

### Tier 2 — Integration Tests (runs on every PR, slower suite)
- Supabase auth flow (login, logout, session expiry, protected route redirect)
- Cart store: add / remove / quantity update / localStorage sync
- Shopify GraphQL: product fetch, variant selection, checkout URL generation
- Zod form validation: boundary inputs on all forms
- i18n: language switching persists and all `t()` calls resolve

### Tier 3 — Security Regression (runs nightly or on release branch)
- Auth bypass probes: direct navigation to `/dashboard` without session
- IDOR probes: accessing other users' Supabase data
- Shopify token exposure: verify `VITE_SHOPIFY_ACCESS_TOKEN` not in build output
- Cart manipulation: negative quantity, zero-price checkout
- XSS: stored strings from Supabase rendered without escaping
- Race condition: simultaneous cart operations

### Tier 4 — Performance Baseline (runs on release branch)
- Lighthouse audit: Performance, Accessibility, Best Practices, SEO scores
- React Query: verify stale-while-revalidate and no redundant fetches
- Bundle size: `npx vite build` — check chunk sizes; flag any chunk > 500 KB
- Re-render profiling: React DevTools Profiler on ProductGrid and CartDrawer

### Tier 5 — Manual / One-Time
- PWA install flow on mobile (iOS Safari + Android Chrome)
- Capacitor native build smoke test
- Language switcher: all three locales (en / fr / rw) on every page
- Shopify checkout: end-to-end purchase in Shopify test mode
- Dark mode: visual regression across all pages

---

## STEP 6 — Comprehensive Test Document Output

Produce a single professional document and write it to: `tests/test-plan-[YYYY-MM-DD].md`

The document MUST follow this structure exactly:

---

### DOCUMENT STRUCTURE

```
# Comprehensive Test Plan — Gorilla Guardians HandCrafts
**Generated:** [date]
**Scope:** Security + Code Quality
**Tech Stack:** React 18 + TypeScript + Vite + Shopify Storefront API + Supabase + Capacitor
**Test Frameworks:** Vitest + React Testing Library (unit/component) | Playwright (E2E) | ESLint + tsc (static)

---

## 1. Executive Summary
- Total test cases: [N] (Security: [N] | Code Quality: [N])
- Priority (from audit findings): [N]
- Automated: [N] | Manual: [N]
- Estimated CI run time: [estimate]
- Overall test coverage assessment: [score /10]

---

## 2. Test Strategy
### 2.1 Objectives
### 2.2 Scope & Out-of-Scope
### 2.3 Tools & Frameworks
### 2.4 Environments (local / CI / staging / Shopify test mode)
### 2.5 Definition of Done

---

## 3. Test Coverage Matrix
[Full domain × type matrix from Step 4]

---

## 4. Security Test Suite
[All test cases from Step 2, grouped by domain]
For each case:
  - Test ID
  - Description
  - Type
  - Setup
  - Action (with code scaffold if applicable)
  - Expected Result
  - Priority (from audit: YES/NO + finding reference)

---

## 5. Code Quality Test Suite
[All test cases from Step 3, grouped by domain]
Same format as Section 4.

---

## 6. Test Execution Plan
[Full tiered plan from Step 5]

---

## 7. CI/CD Integration Guide
- Commands to add to CI pipeline
- Threshold configurations (coverage %, Lighthouse scores, bundle size limits)
- Fail conditions (what fails the build)
- Example GitHub Actions YAML snippet for Vite + Vitest + npm audit

---

## 8. Traceability Matrix
| Test ID | Skill Domain | Audit Finding (if any) | Severity | Automated? |
|---------|-------------|------------------------|----------|------------|
[auto-populated from all test cases]

---

## 9. Acceptance Criteria
- Minimum coverage thresholds to pass
- Zero tolerance items (tests that must never fail before release)
- Known limitations and risk acceptance

---

## 10. Appendix
### A — Testing Cheat Sheet (quick-run commands)
### B — Mocking Patterns (Shopify API, Supabase, Zustand store)
### C — Test Data & Fixtures Guide (Shopify test products, Supabase seed data)
```

---

## STEP 7 — Checklist Verification

Before finalizing the document, verify:

- [ ] Every security domain has ≥ 1 test case
- [ ] Every code-quality domain has ≥ 1 test case
- [ ] Every Critical/High audit finding has a corresponding PRIORITY test case
- [ ] Coverage matrix has no GAP cells for Critical domains (auth, authz, input validation, cart logic)
- [ ] CI integration guide includes concrete commands for Vite + Vitest + npm audit
- [ ] Traceability matrix is complete (no test case missing a row)
- [ ] Document written to `tests/test-plan-[date].md`

If any check fails: complete the missing item before writing the document.
