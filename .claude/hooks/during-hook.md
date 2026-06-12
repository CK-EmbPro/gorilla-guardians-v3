# DURING-HOOK — Orchestrator (runs WHILE writing code)

ROLE: Orchestrator only. Do NOT perform security or quality analysis directly.
Delegate all checks to the skill modules listed below.
If a skill raises a violation: STOP, report, and wait for resolution before continuing.

---

## ROUTING TABLE — Invoke the correct skills based on what is being written

### Security Skills (enforce continuously)

Whenever writing Supabase auth, session, or token code:
  → .claude/skills/security/authentication-flow-review.md
  → .claude/skills/security/session-cookie-security.md

Whenever writing role guards, `useUserRole`, or route-level permission checks:
  → .claude/skills/security/authorization-implmentation.md

Whenever writing any form input, Zod schema, or API request body:
  → .claude/skills/security/input-validation.md

Whenever writing Supabase queries, `.from()` calls, or RLS-sensitive operations:
  → .claude/skills/security/database-security.md

Whenever writing code that reads from `import.meta.env`, config, or hardcodes API keys:
  → .claude/skills/security/secrets-management-audit.md

Whenever writing log statements, error tracking, or observability code:
  → .claude/skills/security/logging-monitoring.md

Whenever writing cart logic, pricing, checkout, or multi-step booking workflow:
  → .claude/skills/security/business-logic-vulnerabilities.md

Whenever writing fetch calls, Shopify GraphQL queries, CORS config, or response headers:
  → .claude/skills/security/api-and-infrastructure.md
  → .claude/skills/security/security-misconfiguration.md

Whenever writing file upload, image storage, or path resolution code:
  → .claude/skills/security/file-handling-business-logic.md

Whenever writing HTTP client calls, outbound Shopify/Supabase requests, or webhooks:
  → .claude/skills/security/ssrf-and-open-redirect.md

Whenever adding or upgrading a dependency in `package.json`:
  → .claude/skills/security/dependency-supply-chain.md
  → .claude/skills/code-quality/dependency-management.md

---

### Code-Quality Skills (enforce continuously)

Every React component, custom hook, context, or store written:
  → .claude/skills/code-quality/solid-principles.md
  → .claude/skills/code-quality/readability-and-naming.md

Every try/catch, error boundary, React Query `onError`, or failure path written:
  → .claude/skills/code-quality/error-handling-resilience.md
  → .claude/skills/code-quality/exception-flow-analysis.md

Any code that calls Shopify Storefront API, Supabase, or any external service:
  → .claude/skills/code-quality/resilience-fault-tolerance.md
  → .claude/skills/code-quality/performance-analysis.md

Any structural pattern or abstraction introduced (custom hook, context, store, service):
  → .claude/skills/code-quality/design-pattern-implmentation.md

Any logic that duplicates existing hook, helper, or component behaviour:
  → .claude/skills/code-quality/code-duplication-detection.md

---

## VIOLATION PROTOCOL

If any invoked skill raises an issue:
1. STOP code generation immediately
2. Label the violation with: skill-module | severity | CWE (if applicable)
3. Show the violating line(s)
4. Propose a secure / compliant alternative
5. Resume only after the fix is accepted or explicitly waived by the user

---

## OUTPUT (per code block written)

- Clean, compiling TypeScript code
- Inline delegation notes: which skills were consulted and what they validated
- Violation report (if any) with proposed fix — no silent suppression
