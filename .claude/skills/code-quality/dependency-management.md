# Dependency Management

Evaluate the health, hygiene, and maintainability of all project dependencies.

---

## Check for:

### 1. OUTDATED DEPENDENCIES

   - List all direct dependencies and their current vs latest version
   - Flag major version gaps (e.g., `express@4` when `express@5` is stable)
   - Prioritize packages that are security-sensitive or frequently patched:
     auth libs, HTTP clients, parsers, ORM, serializers, crypto utilities
   - Identify deprecated packages that have official successors
   - For Flutter: check `flutter pub outdated` and `dart pub outdated`
   - For Node: check `pnpm outdated` / `npm outdated`

### 2. DEPENDENCY BLOAT & DUPLICATION

   - Multiple packages solving the same problem (e.g., two date libraries, two HTTP clients)
   - Direct dependencies duplicating functionality already in the framework (e.g., separate `uuid` when Prisma has built-in CUID/UUID)
   - `devDependencies` incorrectly listed as `dependencies` (ships to production unnecessarily)
   - Unused dependencies: imported packages never actually referenced in source
   - Transitive dependency duplication: same package at multiple versions in lock file

### 3. LOCK FILE HYGIENE

   - Lock file committed and up to date with manifest
   - Lock file not manually edited
   - Lock file re-generated after any manual manifest change (no drift)
   - No `package-lock.json` AND `yarn.lock` both present (pick one)

### 4. PEER DEPENDENCY CONFLICTS

   - Unresolved peer dependency warnings that could cause runtime issues
   - Forced resolutions / overrides that may introduce incompatibilities
   - Packages requiring different versions of a shared transitive dependency

### 5. MAJOR VERSION MIGRATION RISK

   - Identify breaking changes in newer major versions of current dependencies
   - Flag APIs used in codebase that are removed/changed in available upgrades
   - Assess migration effort for high-priority upgrades

### 6. PRIVATE / INTERNAL DEPENDENCY SECURITY

   - Private packages published to correct registry (not accidentally to public npm)
   - Internal packages have explicit version pins, not `*` or `latest`
   - No circular dependencies between internal packages

### 7. LICENSE COMPATIBILITY

   - GPL/AGPL/SSPL dependencies in a commercial/proprietary project flagged
   - Copyleft transitive dependencies identified
   - Missing `license` field in internal packages

### 8. FLUTTER / MOBILE SPECIFIC (if applicable)

   - Pub.dev packages with low pub points or no null-safety support flagged
   - Packages that require platform-specific permissions reviewed for necessity
   - Plugin packages that are discontinued or have unresolved critical issues

---

## Provide:

A structured finding report with the following for each issue:

Title, Severity (High/Medium/Low), Evidence (package name, current version, latest stable version), and a short Why it matters (security, compatibility, maintainability).

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a "Proposed Fix Plan".
2. For each issue, include:
   - What will change (version bump, package removal, replacement)
   - Why the change is needed
   - Risk if NOT addressed
   - Exact manifest change or migration step

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: exact version updates, removal commands, replacement packages with migration notes.

Top 3–5 prioritized dependency changes ranked by risk/effort ratio.

A checklist diff: which items from the "Check for" list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact package names and versions.

Do not invent packages that aren't present; if context is missing, mark as Unable to verify and state what manifest or lock file is needed.

Write this into a markdown file and place it in the audits/ folder.
