# Dependency & Supply Chain Security

OWASP A06:2021 — Vulnerable and Outdated Components

Audit all third-party dependencies and the supply chain that delivers them.

---

## Check for:

### 1. Known Vulnerable Dependencies
   - Run dependency vulnerability scan (npm audit / yarn audit / pnpm audit / flutter pub outdated)
   - Identify packages with CVEs at Critical/High severity
   - Check transitive (indirect) dependencies, not only direct ones
   - Flag packages that are unmaintained (no commits > 2 years, archived repos)

### 2. Outdated Dependencies
   - List dependencies that are multiple major versions behind
   - Prioritize security-relevant packages: auth libs, crypto libs, HTTP parsers, serializers
   - Check for packages with known breaking security fixes in newer versions

### 3. Dependency Integrity & Provenance
   - Lock files present and committed (package-lock.json / pnpm-lock.yaml / pubspec.lock)
   - Lock files not manually edited or inconsistent with manifests
   - npm package integrity hashes (`integrity` field in lock file) intact
   - No use of `--ignore-scripts` bypass that could mask malicious install scripts

### 4. Typosquatting & Dependency Confusion
   - Check for packages with names very similar to well-known packages
   - Private package names not colliding with public registry names
   - Scoped packages (`@org/pkg`) used where available to prevent confusion attacks

### 5. Overly Permissive install/postinstall Scripts
   - Review any `preinstall`, `install`, `postinstall` scripts in dependencies
   - Flag packages that execute shell commands or network requests during install

### 6. License Compliance
   - Identify dependencies with GPL/AGPL/SSPL licenses that may be incompatible with proprietary code
   - Flag missing or ambiguous license declarations
   - Ensure OSS license obligations (attribution, source disclosure) are met

### 7. CI/CD Pipeline Integrity
   - Dependencies resolved from trusted registries only (npmjs.com, pub.dev)
   - No direct `git://` or arbitrary URL dependencies in production manifests
   - Private registry authentication tokens are secrets, not hardcoded
   - Dependency auditing runs as a mandatory CI step (fails build on Critical/High CVEs)

### 8. Runtime Dependency Exposure
   - Development-only packages not bundled into production builds
   - `devDependencies` correctly separated from `dependencies`
   - Bundle size analysis for unexpected large or suspicious packages

---

## Provide:

A structured finding report with the following for each issue:

Title, Severity (Critical/High/Medium/Low), CVE/CWE (if applicable), Evidence (package name, version, dependency path), and a short Why it matters.

Exploitability notes: describe attack vector without providing working exploits.

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a "Proposed Fix Plan".
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Risk if NOT fixed
   - Exact version upgrade or config change

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: exact version pins, audit commands, CI config snippets.

A summary risk score (0–10) and top 3–5 prioritized upgrades.

A checklist diff: which items from the "Check for" list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact package names and versions.

Do not invent packages that aren't present; if context is missing, mark as Unable to verify and state what manifest/lock file is needed.

Write this into a markdown file and place it in the audits/ folder.
