# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M001 planning | architecture | Split LLM work into two server endpoints | Use `POST /api/extract` for Claude structured extraction and `POST /api/summarize` for Claude summary. | This keeps API-key-bearing LLM work server-side while enabling a real staged UI. A single combined endpoint would force theatrical client-side reveal timing and weaken the architecture story. | Yes | collaborative |
| D002 | M001 planning | architecture | Run lumber optimization client-side and deterministically | Run First Fit Decreasing optimization as pure TypeScript in the browser. | The optimizer is deterministic, instant, and does not need secrets. Keeping it out of the LLM demonstrates the intended division of labor: language models handle ambiguity, code handles exact computation. | Yes | human |
| D003 | M001 planning | delivery | Start implementation with a thin vertical slice | Build a mocked end-to-end flow first, then replace mocks with real Claude calls. | For a one-night demo, a visible vertical slice keeps the project demoable even if LLM integration or deployment takes longer than expected. | Yes | human |
| D004 | M001 planning | testing | Use Vitest rather than Jest | Use Vitest for optimizer unit tests. | Vitest avoids unnecessary Jest plus Next.js plus TypeScript setup friction and is sufficient for testing the pure optimizer module. | Yes | human |
| D005 | M001 planning | domain-model | Use inches as the single internal length unit | Normalize all code paths to inches internally; convert to feet or feet/inches only for display. | Construction inputs mix board lengths in feet and spacing/cuts in inches. One internal unit prevents classic conversion bugs in optimization and cost/waste math. | Yes | human |
