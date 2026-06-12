# Performance Analysis

Evaluate the codebase for runtime performance issues, inefficient patterns, and resource waste.

---

## Check for:

### 1. DATABASE QUERY PERFORMANCE

   N+1 Query Problem:
   - Loops that execute a query per iteration (e.g., `for item of list { await prisma.x.findUnique(...) }`)
   - Missing `include` / `select` on ORM calls that cause lazy loading loops
   - Batch operations available but not used (use `findMany` with `where IN` instead)

   Missing or Inefficient Indexes:
   - Filter/sort columns without indexes (check `WHERE`, `ORDER BY`, `JOIN` conditions)
   - Over-indexed tables (too many indexes slow writes)
   - Composite index column order wrong for query patterns

   Unbounded Queries:
   - No `take` / `limit` on list queries — can scan full tables
   - No cursor-based or offset pagination

   Eager Loading vs. Selective Fields:
   - `SELECT *` / `findMany()` returning all columns when only a subset is needed
   - Deep nested `include` chains that pull more data than needed

### 2. MEMORY & RESOURCE LEAKS

   - Event listeners added but never removed (`EventEmitter.addListener` without `removeListener`)
   - Timers (`setInterval`, `setTimeout`) not cleared when component/service is destroyed
   - Stream / file handles not properly closed (`fs.createReadStream` without error+close handlers)
   - Large arrays/objects accumulated in memory over request lifetime without cleanup
   - Caches with no eviction policy (unbounded Map/object growth)

### 3. SYNCHRONOUS BLOCKING IN ASYNC CONTEXT

   - Synchronous file I/O (`fs.readFileSync`, `fs.writeFileSync`) in request handlers
   - `bcrypt.hashSync` / crypto sync operations in hot paths
   - CPU-intensive computation (sorting large arrays, regex on large strings) on the main thread
   - Blocking `JSON.parse` / `JSON.stringify` on very large payloads

### 4. ALGORITHMIC COMPLEXITY

   - O(n²) or worse patterns: nested loops over unsorted lists, repeated `Array.find()` in loops
   - Linear search in collections that should be indexed (use Map/Set for O(1) lookups)
   - Recursive algorithms without memoization or depth limits
   - Regex with catastrophic backtracking potential on user-supplied input

### 5. EXTERNAL CALL EFFICIENCY

   - Sequential `await` calls that could be parallelized (`Promise.all`)
   - No caching for repeated identical external API calls within a request or short window
   - No connection pooling or reuse for HTTP clients
   - Retry logic with no backoff — hammers failing services

### 6. RESPONSE PAYLOAD SIZE

   - API responses returning entire domain objects when clients only need a subset
   - No pagination on list endpoints
   - Binary/media assets not served via CDN or object storage
   - Compression (`gzip` / `brotli`) not enabled on HTTP responses

### 7. CONCURRENCY & THROUGHPUT

   - Long-running synchronous operations starving the event loop
   - Worker threads or job queues not used for CPU-heavy tasks
   - No request timeout configured — slow clients hold connections indefinitely
   - Connection pool limits too low for expected concurrency

---

## Provide:

A structured finding report with the following for each issue:

Title, Severity (High/Medium/Low — no CWE for pure perf issues, but flag if it enables DoS → CWE-400/770), Evidence (file, function, line ranges), and a short Why it matters (latency, memory, cost, DoS risk).

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a "Proposed Fix Plan".
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Estimated impact (latency, memory, throughput)
   - Code-level fix snippet (if available)

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: precise code-level fix with before/after comparison where helpful.

Top 3–5 highest-impact performance fixes ranked by effort vs gain.

A checklist diff: which items from the "Check for" list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact code locations and identifiers.

Prefer minimal, targeted fix snippets over large refactors.

Do not invent files or functions that aren't present; if context is missing, mark as Unable to verify and say what code would prove it.

Write this into a markdown file and place it in the audits/ folder.
