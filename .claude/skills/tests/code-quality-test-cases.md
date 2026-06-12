# Code Quality Test Cases

Domain-expert test skill. Derives concrete, executable test cases from every code-quality skill domain.
Called by `.claude/hooks/test-hook.md`. Do NOT invoke directly.

For each test case produced, include:
- **Test ID** (e.g., `CQ-SOLID-001`)
- **Domain** (skill it maps to)
- **Type**: Unit | Component | Integration | Static | Automated-CI | Manual Review
- **Setup**: preconditions, tools needed
- **Action**: exact verification step
- **Expected Result**: precise pass condition
- **Failure Means**: what quality property is broken if this test fails

---

## 1. Architecture & Design (→ `initial-software-design-analyis.md`)

### CQ-ARCH-001 — No circular dependencies in src/
Type: Static / Automated-CI
Setup: Install `madge` — `npm install --save-dev madge`.
Action: `npx madge --circular src/`
Expected: Output lists zero circular dependencies.
Failure means: Tight coupling between modules — components, hooks, or stores that cannot be tested or replaced independently.

### CQ-ARCH-002 — Pages import from components/hooks/stores — not from other pages
Type: Static / Manual Review
Action: Verify no file in `src/pages/` imports from another file in `src/pages/`. Cross-page shared logic must live in `src/hooks/`, `src/components/`, or `src/stores/`.
Expected: Zero cross-page imports.
Failure means: Page-level coupling — changing one page breaks another unexpectedly.

### CQ-ARCH-003 — No God component (single file > 300 LOC with mixed responsibilities)
Type: Static / Automated-CI
Action: List files in `src/components/` and `src/pages/` with more than 300 non-blank lines. Review each for mixed concerns (data fetching + rendering + state management all in one component).
Expected: No file exceeds 300 lines with mixed responsibilities; data-fetching logic extracted to custom hooks.
Failure means: God component — untestable, hard to reason about, and slow to render.

### CQ-ARCH-004 — Shopify and Supabase calls isolated in dedicated layers
Type: Static / Manual Review
Action: Verify Shopify GraphQL calls are in `src/lib/shopify.ts` only; Supabase client is initialised in `src/integrations/supabase/client.ts` only. Components and pages interact with these via custom hooks or React Query.
Expected: Zero direct `fetch('https://*.myshopify.com*')` or `supabase.from(...)` calls in component or page files.
Failure means: Data-access logic scattered across UI — cannot mock, cannot swap providers.

---

## 2. SOLID Principles (→ `solid-principles.md`)

### CQ-SOLID-001 — Each custom hook has a single, named responsibility (SRP)
Type: Unit / Manual Review
Setup: Pick any hook in `src/hooks/` (e.g., `useAuth`, `useUserRole`, `use-mobile`).
Action: Write unit tests for each returned value or action. Change one concern. Observe which tests break.
Expected: Only tests directly related to that concern break; hooks don't mix auth + UI + cart logic.
Failure means: SRP violated — hook does too much; changes in one area break unrelated behaviour.

### CQ-SOLID-002 — Adding a new language does not require modifying LanguageContext internals (OCP)
Type: Unit / Manual Review
Action: Verify `LanguageContext` supports adding a new locale by extending the `t()` call signature without modifying the context provider logic itself.
Expected: New locale (`pt`, `de`, etc.) can be added by extending the translation object passed to `t()` — no `if` or `switch` modification required inside the context.
Failure means: Open/Closed Principle violated — extension requires modifying the core context.

### CQ-SOLID-003 — No direct instantiation of integration clients inside components (DIP)
Type: Static / Automated-CI
Action: `grep -rn "createClient\|new ShopifyClient" src/components/ src/pages/ src/hooks/`
Expected: Zero matches — Supabase client imported from `src/integrations/supabase/client.ts`; Shopify functions imported from `src/lib/shopify.ts`. Never instantiated inline.
Failure means: DIP violated — components coupled to concrete implementations, not injectable abstractions.

### CQ-SOLID-004 — useLanguage hook exposes only what consumers need (ISP)
Type: Manual Review
Action: Review the interface exposed by `useLanguage`. Verify consumers only access `t`, `language`, `setLanguage` — no extraneous internals.
Expected: Hook surface is minimal and purposeful; no method forcing consumers to handle unused return values.
Failure means: Interface Segregation violated — consumers coupled to methods they don't use.

---

## 3. Design Patterns (→ `design-pattern-implmentation.md`)

### CQ-PATTERN-001 — Custom hooks as the data-access facade (no direct Supabase/Shopify calls in UI)
Type: Static / Manual Review
Action: Confirm components receive data via `useQuery` wrappers or named custom hooks (`useProducts`, `useExperiences`, etc.) — never via inline `supabase.from()` or raw `fetch()`.
Expected: Zero data-fetching calls directly inside component bodies or JSX.
Failure means: No facade/service layer — UI tightly coupled to external APIs; impossible to unit test without network.

### CQ-PATTERN-002 — Cart store uses Command pattern (named actions, not direct state mutation)
Type: Unit
Action: Verify `cartStore.ts` exposes named actions (`addItem`, `removeItem`, `updateQuantity`, `clearCart`) rather than exposing raw `set()` calls to consumers.
Expected: Consumers call named actions; Zustand `set` is never called outside the store file.
Failure means: Uncontrolled state mutation — impossible to trace cart behaviour changes.

### CQ-PATTERN-003 — i18n translation uses a consistent lookup pattern — no ad-hoc string concatenation
Type: Static / Manual Review
Action: Verify all user-facing strings use `t(key, { en, fr, rw })` from `useLanguage` — never `language === 'en' ? 'text' : ...` inline ternaries in JSX.
Expected: All translated strings go through the `t()` helper; no language conditionals in component JSX.
Failure means: Inconsistent i18n — some strings not translated; language switching breaks.

---

## 4. Complexity & Metrics (→ `code-quality-metrics-standards.md`)

### CQ-COMPLEX-001 — No function with cyclomatic complexity > 10
Type: Static / Automated-CI
Setup: Add ESLint rule `"complexity": ["error", 10]` to `.eslintrc` / `eslint.config.js`.
Action: `npm run lint`
Expected: Zero complexity violations across all `.ts` and `.tsx` files.
Failure means: Function is too complex to test all branches; high defect probability.

### CQ-COMPLEX-002 — No component or hook exceeding 80 lines
Type: Static / Automated-CI
Action: ESLint `max-lines-per-function` rule (max: 80) applied to component render functions and hook bodies.
Expected: Zero violations.
Failure means: Component does too much; hard to test and reason about in isolation.

### CQ-COMPLEX-003 — No deeply nested JSX or conditional chains (max nesting depth: 4)
Type: Static / Automated-CI
Action: ESLint `max-depth` rule (max: 4) + manual review of JSX tree depth in complex components.
Expected: Zero violations; complex conditionals extracted into sub-components or helper functions.
Failure means: Cognitive complexity too high; JSX unreadable; render bugs hard to spot.

---

## 5. Code Duplication (→ `code-duplication-detection.md`)

### CQ-DRY-001 — Duplication rate below 5% across src/
Type: Static / Automated-CI
Setup: Install `jscpd` — `npm install --save-dev jscpd`.
Action: `npx jscpd src/ --min-lines 5 --reporters console`
Expected: Duplication percentage < 5%.
Failure means: DRY violated — the same logic in multiple components; bug fixes must be applied in multiple places.

### CQ-DRY-002 — Translation strings not duplicated across components
Type: Manual Review
Action: Search for the same English string literal appearing in more than one component's `t()` call with a different key.
Expected: Shared strings use a common key defined once; no two `t()` calls with different keys for identical text.
Failure means: Translation drift — the same phrase translated differently in different parts of the UI.

### CQ-DRY-003 — Shopify GraphQL query fragments not duplicated
Type: Code review
Setup: `src/lib/shopify.ts`.
Action: Check that repeated field sets (e.g., product fields, variant fields) use GraphQL fragments rather than repeated inline field lists.
Expected: Common field sets defined as fragment strings reused across queries.
Failure means: Changing a product field requires updating every query individually — maintenance burden.

---

## 6. Readability & Naming (→ `readability-and-naming.md`)

### CQ-NAME-001 — No single-letter variable names outside loop counters
Type: Static / Automated-CI
Action: ESLint `id-length` rule (min: 2, exceptions: `i`, `j`, `k`, `_`, `e`).
Expected: Zero violations.
Failure means: Cryptic code; reviewer cannot understand intent without context.

### CQ-NAME-002 — No magic numbers in business logic (cart limits, API versions, cache TTLs)
Type: Static / Automated-CI
Action: ESLint `no-magic-numbers` rule (ignore: `[-1, 0, 1, 100]`). Flag numbers like `30`, `86400`, `2025` appearing inline.
Expected: All business-significant numbers defined as named constants (e.g., `SHOPIFY_API_VERSION`, `CACHE_MAX_AGE_DAYS`).
Failure means: Unexplained values; changing one requires hunting every occurrence.

### CQ-NAME-003 — Props and hook return types are explicitly typed — no implicit `any`
Type: Static / Automated-CI
Action: `npx tsc --noEmit --strict` — confirm zero implicit `any` errors.
Expected: All component props, hook return values, and API response types explicitly typed.
Failure means: Type safety gaps — runtime errors that TypeScript should catch at build time.

---

## 7. Error Handling (→ `error-handling-resilience.md`)

### CQ-ERR-001 — React error boundary wraps all route-level components
Type: Component / Manual Review
Setup: `src/App.tsx`.
Action: Verify each `<Route>` element is wrapped by an `<ErrorBoundary>` component that renders a fallback UI.
Expected: Throwing inside any page component renders the fallback, not a blank white screen.
Failure means: Unhandled render error crashes the entire app — all routes become inaccessible.

### CQ-ERR-002 — React Query errors are surfaced as user-facing messages, not raw objects
Type: Component
Setup: Mock Shopify or Supabase query to return an error.
Action: Render the component that uses the query. Inspect rendered output.
Expected: A user-friendly error message rendered in the UI (e.g., "Failed to load products. Please try again."); no raw error object or stack trace visible.
Failure means: Internal error details exposed to the user.

### CQ-ERR-003 — No empty catch blocks swallowing errors silently
Type: Static / Automated-CI
Action: ESLint `no-empty` rule; also grep for `catch\s*\([^)]*\)\s*\{\s*\}`.
Expected: Zero empty catch blocks; every catch either re-throws, logs, or surfaces an error state.
Failure means: Swallowed exceptions — bugs silently ignored; users see stale state.

### CQ-ERR-004 — Async functions in event handlers use try/catch or `.catch()`
Type: Static / Automated-CI
Action: ESLint `@typescript-eslint/no-floating-promises` rule.
Expected: Zero unhandled promise rejections in source; all async event handlers have explicit error handling.
Failure means: Unhandled rejection causes silent failure or crashes the React component.

---

## 8. Exception Flow (→ `exception-flow-analysis.md`)

### CQ-EXCFLOW-001 — Supabase connection failure handled gracefully
Type: Integration / Component
Setup: Mock Supabase client to throw a network error.
Action: Render a component that depends on Supabase data (e.g., user dashboard).
Expected: Error boundary catches the error or React Query `isError` state renders a fallback; no stack trace shown.
Failure means: Supabase failure crashes the component tree.

### CQ-EXCFLOW-002 — Shopify API timeout handled with user-friendly fallback
Type: Component / Integration
Setup: Mock `src/lib/shopify.ts` to delay response beyond the configured timeout.
Action: Render `ProductGrid` or `ProductDetail`.
Expected: Loading state shown initially; after timeout, error message rendered ("Products unavailable. Please try again."); no hang.
Failure means: Shopify timeout propagates as infinite loading spinner or white screen.

### CQ-EXCFLOW-003 — Error responses are consistent across all data-fetching hooks
Type: Manual Review
Action: Trigger errors from three different sources (Shopify product query, Supabase auth, Supabase data query). Compare error UI rendered.
Expected: All error states render consistent UI — same error component, same messaging pattern.
Failure means: Inconsistent error UX — confusing for users; hard to maintain.

---

## 9. Resilience & Fault Tolerance (→ `resilience-fault-tolerance.md`)

### CQ-RES-001 — React Query retry count is configured and not unlimited
Type: Unit / Static
Setup: `src/` — wherever `useQuery` or `useMutation` hooks are configured.
Action: Verify `retry` option is explicitly set (e.g., `retry: 2`) — not left as the default 3, and never `retry: true` (infinite).
Expected: All queries that call external services have an explicit, bounded retry count.
Failure means: Infinite retry loop hammers a failing Shopify or Supabase endpoint.

### CQ-RES-002 — Cart is recoverable if Shopify checkout URL generation fails
Type: Component / Integration
Setup: Mock `createCheckout` (Shopify mutation) to return an error.
Action: User clicks "Checkout" in `CartDrawer`.
Expected: An error message is shown ("Checkout unavailable — please try again."); cart state preserved; user not redirected.
Failure means: Checkout failure destroys the cart session.

### CQ-RES-003 — Supabase auth failure does not block the public pages
Type: Integration / E2E
Setup: Mock Supabase `auth.getSession()` to return an error.
Action: Load the homepage (`/`) and product pages.
Expected: Public pages render normally; auth failure only affects `/dashboard` (redirects to `/auth`).
Failure means: Auth error propagates globally — entire site broken when Supabase auth is unavailable.

---

## 10. Performance (→ `performance-analysis.md`)

### CQ-PERF-001 — Product list uses React Query pagination — no unbounded product fetches
Type: Component / Integration
Setup: Shopify store with 50+ products.
Action: Load the homepage product grid. Check the Shopify GraphQL request payload.
Expected: Request uses `first: N` with a cursor for pagination; not `first: 999` or uncapped.
Failure means: Unbounded query — slow response and memory exhaustion at scale.

### CQ-PERF-002 — No unnecessary re-renders on cart state changes
Type: Component / Performance
Setup: React DevTools Profiler. Add an item to the cart.
Action: Profile which components re-render on `cartStore` update.
Expected: Only `CartDrawer`, cart item components, and the cart badge re-render; unrelated components (e.g., `Hero`, `ProductGrid`) do not.
Failure means: Global cart state triggers full-page re-renders — degraded performance on every cart action.

### CQ-PERF-003 — Vite production bundle has no chunk larger than 500 KB (uncompressed)
Type: Automated-CI
Setup: Run `npm run build`.
Action: Inspect `dist/assets/` for chunk sizes: `npx vite build --reporter json` or check rollup output.
Expected: No individual chunk exceeds 500 KB uncompressed. Large dependencies (Supabase SDK, shadcn components) are code-split.
Failure means: Oversized bundle — slow First Contentful Paint; poor Lighthouse score.

### CQ-PERF-004 — Images from Shopify CDN are lazy-loaded
Type: Component / Static
Action: Search `src/` for `<img` tags loading Shopify CDN images. Verify `loading="lazy"` attribute present.
Expected: All off-screen Shopify product images use `loading="lazy"`.
Failure means: All images fetched on page load — excessive bandwidth and slow LCP.

---

## 11. Dependency Management (→ `dependency-management.md`)

### CQ-DEP-001 — No unused dependencies in package.json
Type: Static / Automated-CI
Setup: Install `depcheck` — `npm install --save-dev depcheck`.
Action: `npx depcheck`
Expected: Zero "Unused dependencies" reported.
Failure means: Bloated bundle; unnecessary attack surface; maintenance confusion.

### CQ-DEP-002 — devDependencies not imported in production source files
Type: Static / Automated-CI
Action: ESLint `import/no-extraneous-dependencies` rule (`devDependencies: true`).
Expected: Zero production source files in `src/` importing dev-only packages (e.g., testing libraries, build tools).
Failure means: Dev tool imported at runtime — production bundle larger than necessary or breaks in production.

### CQ-DEP-003 — package-lock.json committed and consistent with package.json
Type: Automated-CI
Action: `npm ci` in CI (exits non-zero if lock file is inconsistent).
Expected: Exit code 0 — reproducible installs across environments.
Failure means: Different dependency versions resolved in CI vs development — environment-specific bugs.

---

## 12. Testing Implementation (→ `testing-implementation.md`)

### CQ-TEST-001 — Unit test coverage ≥ 80% on custom hooks in src/hooks/
Type: Automated-CI
Setup: Vitest configured with `@vitest/coverage-v8`.
Action: `npx vitest run --coverage`
Expected: Statement coverage ≥ 80% for all files in `src/hooks/`; branch coverage ≥ 70%.
Failure means: Untested hook logic ships to production unverified.

### CQ-TEST-002 — Each custom hook has at least one error-path test
Type: Unit / Manual Review
Action: For each hook in `src/hooks/`, verify at least one test covers the error case: Supabase error, Shopify API failure, or missing session.
Expected: Every hook has ≥ 1 test asserting correct error state or fallback behaviour.
Failure means: Only happy-path tested; hook failures discovered in production.

### CQ-TEST-003 — Cart store tests cover add, remove, update, and clear operations
Type: Unit
Setup: Vitest test for `src/stores/cartStore.ts` using `@testing-library/react` or direct Zustand store invocation.
Action: Test each cart action in isolation. Assert store state after each operation.
Expected: All four operations (add, remove, update quantity, clear) have passing tests; edge cases covered (add duplicate item, remove non-existent item, quantity update to 0).
Failure means: Cart logic bugs ship silently — pricing or inventory errors at checkout.

### CQ-TEST-004 — Component tests use mocked Shopify and Supabase — no real network calls
Type: Unit / Component
Setup: Vitest + React Testing Library with `vi.mock('src/lib/shopify')` and `vi.mock('src/integrations/supabase/client')`.
Action: Run component tests. Verify no test makes a real HTTP request.
Expected: All tests pass without network access; mocks return fixtures consistent with actual API response shapes.
Failure means: Tests depend on external services — flaky CI; tests pass locally but fail in offline CI.

### CQ-TEST-005 — Tests are order-independent (no shared mutable state between test files)
Type: Unit
Action: Run Vitest twice: once in declared order, once with `--sequence.shuffle`. Compare results.
Expected: Identical pass/fail results regardless of execution order.
Failure means: Shared Zustand store or module-level state bleeds between tests — brittle suite.
