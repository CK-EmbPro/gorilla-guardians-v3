Evaluate testing implementation for this software project

Analyze:

1. TEST COVERAGE
   - Unit test coverage percentage
   - Integration test presence
   - E2E test coverage
   - Uncovered critical paths

2. TEST QUALITY
   - Test naming clarity
   - Arrange-Act-Assert pattern
   - Test independence
   - Mock usage appropriateness
   - Test data management

3. TEST PATTERNS
   - Test pyramid adherence (unit > integration > E2E)
   - Testing anti-patterns (testing implementation vs behavior)
   - Brittle tests identification
   - Test speed issues

4. MISSING TESTS
   - Error scenarios
   - Edge cases
   - Security tests
   - Performance tests

Provide a test improvement plan with examples.

## Provide:

A structured finding report with the following for each issue:

Title, Severity (Critical/High/Medium/Low), CWE (if applicable), Evidence (file, function, line ranges), and a short Why it matters.

Exploitability notes and, where safe, a minimal PoC or reproduction steps (no real secrets).

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a “Proposed Fix Plan”.
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Risk if NOT fixed
   - Exact code-level fix snippet (if available)

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: precise code-level fix or config change (snippets welcome), plus defense-in-depth guidance.

A summary risk score (0–10) and top 3–5 prioritized fixes that reduce risk fastest.

A checklist diff: which items from the “Check for” list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact code locations and identifiers.

Prefer minimal, drop-in fix snippets over prose.

Do not invent files or functions that aren’t present; if context is missing, mark as Unable to verify and say what code would prove it.

Write this into a markdown file and place it in the audits/ folder.