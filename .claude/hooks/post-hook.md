# POST-HOOK — Orchestrator (runs AFTER generating code)

ROLE: Orchestrator only. Do NOT perform analysis directly.
Invoke every skill module below in the declared order.
Never skip a module. If context is insufficient, mark as "Unable to verify" and state what file/code is needed.

---

## PHASE 1 — Code Quality Audit (invoke all, in order)

### 1.1 Architecture & Design
  → .claude/skills/code-quality/initial-software-design-analyis.md
  → .claude/skills/code-quality/solid-principles.md
  → .claude/skills/code-quality/design-pattern-implmentation.md

### 1.2 Complexity & Metrics
  → .claude/skills/code-quality/code-quality-metrics-standards.md
  → .claude/skills/code-quality/code-duplication-detection.md
  → .claude/skills/code-quality/readability-and-naming.md

### 1.3 Resilience & Error Handling
  → .claude/skills/code-quality/error-handling-resilience.md
  → .claude/skills/code-quality/exception-flow-analysis.md
  → .claude/skills/code-quality/resilience-fault-tolerance.md

### 1.4 Performance & Dependencies
  → .claude/skills/code-quality/performance-analysis.md
  → .claude/skills/code-quality/dependency-management.md

### 1.5 Testing
  → .claude/skills/code-quality/testing-implementation.md

---

## PHASE 2 — Security Audit (invoke all, in order)

### 2.1 Authentication & Session
  → .claude/skills/security/authentication-flow-review.md
  → .claude/skills/security/session-cookie-security.md

### 2.2 Authorization
  → .claude/skills/security/authorization-implmentation.md

### 2.3 Input & Injection
  → .claude/skills/security/input-validation.md
  → .claude/skills/security/ssrf-and-open-redirect.md

### 2.4 Data Layer
  → .claude/skills/security/database-security.md

### 2.5 Secrets & Configuration
  → .claude/skills/security/secrets-management-audit.md
  → .claude/skills/security/security-misconfiguration.md

### 2.6 Observability
  → .claude/skills/security/logging-monitoring.md

### 2.7 Business Logic
  → .claude/skills/security/business-logic-vulnerabilities.md

### 2.8 API & Infrastructure
  → .claude/skills/security/api-and-infrastructure.md

### 2.9 File Handling
  → .claude/skills/security/file-handling-business-logic.md

### 2.10 Supply Chain
  → .claude/skills/security/dependency-supply-chain.md

---

## PHASE 3 — Issue Aggregation

For every finding raised by any skill module above:
- Title
- Source skill module (e.g., `security/secrets-management-audit`)
- Severity: Critical | High | Medium | Low
- CWE (if applicable)
- Exact file / component / hook / line reference
- Exploit scenario (safe abstraction only — no working exploits)
- Minimal fix snippet

---

## PHASE 4 — PRE-FIX APPROVAL GATE (mandatory — do not skip)

Before applying any fix:

1. Present ALL findings as a "Proposed Fix Plan" grouped by phase (Quality → Security)
2. For each finding include:
   - What changes
   - Why it matters
   - Risk if ignored
   - Patch snippet
3. Ask explicitly: "Approve these fixes? (Yes / No / Modify specific items)"
4. STOP and WAIT for user response.

Only proceed to Phase 5 after explicit user approval.

---

## PHASE 5 — Final Report (invoke after approval)

  → .claude/skills/security/comprehensive-security-report.md

Produce and write to `audits/` folder:
- Structured audit report (quality + security findings)
- Composite risk score (0–10)
- Top 3–5 prioritized fixes ranked by impact
- Pass/Fail/NA checklist across all invoked skill modules:

### Security Checklist
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

### Code Quality Checklist
  [ ] initial-software-design-analyis
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
