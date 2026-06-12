# PRE-HOOK — Orchestrator (runs BEFORE writing any code)

ROLE: Orchestrator only. Do NOT perform analysis directly.
Delegate all analysis to the skill modules listed below.

---

## STEP 1 — Initial Architecture Analysis

Invoke skill:
  → .claude/skills/code-quality/initial-software-design-analyis.md

Produce:
- Architectural pattern identified (SPA / component tree / layered hooks)
- Layer dependency map (pages → components → hooks → stores / integrations)
- Data flow summary (React Query → Shopify / Supabase → component)
- External service integrations (Shopify Storefront API, Supabase)
- Trust boundaries (client-side vs Supabase RLS vs Shopify server-side)

---

## STEP 2 — Initial Security Surface Analysis

Invoke skill:
  → .claude/skills/security/initial-security-analysis.md

Produce:
- All entry points (React Router routes, form submissions, API call sites)
- All data-fetching paths and their auth gates (`useAuth`, Supabase session checks)
- Auth/authZ flow path (Supabase Auth → `useAuth` → `useUserRole` → route guard)
- File upload locations (if any)
- Rate limiting status on Shopify and Supabase calls
- Dependency surface (`package.json` / `package-lock.json`)

---

## STEP 3 — Affected Domain Mapping

Based on what is about to be written, select which skill modules will be activated
in the during-hook and post-hook. Map the change type to its domain(s):

| Change Type                          | Security Skills to Activate                                                     | Code-Quality Skills to Activate                         |
|--------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------|
| Auth / login / Supabase session      | authentication-flow-review, session-cookie-security                             | solid-principles, error-handling-resilience             |
| Roles / route guards / useUserRole   | authorization-implmentation                                                     | solid-principles, design-pattern-implmentation          |
| Forms / DTOs / Zod schemas           | input-validation, business-logic-vulnerabilities                                | readability-and-naming, code-quality-metrics-standards  |
| Supabase queries / RLS               | database-security, input-validation, secrets-management-audit                   | code-duplication-detection, resilience-fault-tolerance  |
| File upload / storage                | file-handling-business-logic, api-and-infrastructure                            | error-handling-resilience, exception-flow-analysis      |
| React Router routes / API calls      | api-and-infrastructure, authorization-implmentation, input-validation           | solid-principles, testing-implementation                |
| Shopify cart / checkout / pricing    | business-logic-vulnerabilities, logging-monitoring, api-and-infrastructure      | resilience-fault-tolerance, exception-flow-analysis     |
| Config / env vars / secrets          | secrets-management-audit, security-misconfiguration                             | dependency-management                                   |
| Shopify API / Supabase integrations  | ssrf-and-open-redirect, api-and-infrastructure, dependency-supply-chain         | resilience-fault-tolerance, performance-analysis        |
| Any code change                      | logging-monitoring                                                              | solid-principles, readability-and-naming                |

---

## STEP 4 — Early Risk Flags

Invoke the following only if the relevant domain is flagged in Step 3:
- Auth bypass risk → .claude/skills/security/authentication-flow-review.md
- IDOR / privilege risk → .claude/skills/security/authorization-implmentation.md
- Supabase RLS bypass → .claude/skills/security/database-security.md
- Missing Zod validation → .claude/skills/security/input-validation.md
- Hardcoded Shopify / Supabase credentials → .claude/skills/security/secrets-management-audit.md
- SOLID violations → .claude/skills/code-quality/solid-principles.md

---

## OUTPUT (required before any code is written)

1. Architecture summary (2–5 lines)
2. Activated skill module list for during-hook and post-hook
3. Risk flags detected (if any) — with the skill module that flagged it
4. If context is missing for any skill: state "Unable to verify — [reason]"
