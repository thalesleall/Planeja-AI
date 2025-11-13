.## Architecture Decision Record (ADR) Template

Each ADR records a single architecture decision. Use this template to produce clear, testable, and actionable records that developers can follow and verify.

## Standard ADR Structure

- Status: Proposed | Accepted | Deprecated | Superseded (with link)
- Date: YYYY-MM-DD
- Owners: Name(s) <email@example.com>
- Links: Issue/Ticket, PR, Docs, Dashboards
- Context: Background, problem, constraints, decision drivers, evidence (link to metrics)
- Decision: The choice made, specific and testable
- Alternatives Considered: Options with pros/cons
- Consequences: Positive/negative impacts, risks, rollback plan
- Implementation Plan: High-level steps (checklist)
- Testing and Verification: How we validate and monitor
- Traceability: RFs and RNFs affected; matrix link
- Effort Estimate: Ranges/assumptions by role


---

## Naming & Storage Conventions

- File path: `#ADRs/YYYY-MM-DD_DECISION_SHORT_TITLE.md`
- Filename example: `2025-11-11_USE_REDIS_CACHE.md`
- When an ADR is superseded, add a short link at the top and set Status: Superseded


## Guidance / Before You Start

- Collect metrics or links to dashboards that motivated this decision (Grafana, Sentry, product analytics).
- Collect related issues/acceptance criteria, design sketches, and service boundaries.
- List impacted repositories/services and the expected change surface (DB, API, infra, UI).
- If the ADR involves AI, list data privacy constraints, PII rules, and required secrets/roles.


## Template

Title: Brief, imperative descriptive title

- Status: Proposed | Accepted | Deprecated | Superseded (with link)
- Date: YYYY-MM-DD
- Owners: Name(s) <email@example.com>
- Links: Issue/Ticket, PR, Docs, Dashboards

### Context

Describe the background, the concrete problem, constraints, and decision drivers. Include links to graphs, dashboards or user-reported issues. Be specific about the operational and product context.

Example prompts to fill this section:
- When did the problem start (dates)?
- Which metrics or customer feedback highlight the issue? (link Grafana / Sentry / support ticket)
- Which teams and services are affected?

### Decision (Solution)

State the decision clearly and precisely. This must be actionable and testable. Avoid vague sentences.

Example:
We will implement application-layer caching using Redis (via StackExchange.Redis) and expose a single `ICache` interface to the service layer. The product offers endpoint will consult the cache for up to 7 days; if a cache miss happens, the endpoint will execute the DB query and populate Redis.

Rationale: include why this is chosen over other options (cost, latency, team experience, infra constraints).

### Alternatives Considered

List alternatives and pros/cons for each. Be explicit about the tradeoffs.

- Alternative A: CDN/edge caching (CloudFront) — Pros: offloads origin; Cons: hard to cache highly dynamic JSON and requires cache invalidation coordination.
- Alternative B: In-memory local cache — Pros: zero infra; Cons: not shared across pods, inconsistent between instances.
- Alternative C: Redis cluster — Pros: shared state between pods; Cons: additional infra cost and operational effort.

### Consequences

Describe positive and negative impacts, operational risks, cost impacts, security/privacy notes, and rollback plan.

Rollback plan checklist (example):
- [ ] Revert PR and redeploy previous stable image
- [ ] Run DB migration rollback (if DB changes made)
- [ ] Disable feature flag and purge cache if necessary


### Implementation Plan (Detailed Checklist)

Provide a step-by-step checklist engineers can follow. Include code-level guidance (library names, config keys, example endpoints) and which team/owner is responsible.

Example (Redis cache):
- [ ] Create feature branch: `feat/adr/redis-cache`
- [ ] Add package `ioredis` (or `redis`) to backend service
- [ ] Add typed wrapper `src/lib/cache.ts` exposing `get(key)`, `set(key, value, ttl)`, `del(key)`
- [ ] Wire the cache wrapper into DI (or singleton) and guard with a feature flag `ENABLE_SHARED_CACHE`
- [ ] Update products-offers endpoint to consult cache for 7 days before database query
- [ ] Add metrics (Prometheus): cache_hits_total, cache_misses_total, cache_set_total
- [ ] Add documentation to repo `docs/infra/cache.md` with configuration examples
- [ ] Create infra IaC changes (Terraform/CloudFormation) to provision Redis (if not present)
- [ ] Create rollout plan and enable behind feature flag for 10% of traffic, monitor for 24h


### Testing and Verification (Test Cases)

List unit, integration, load, and manual test cases required. Always include observability assertions.

Unit/Integration tests:
- [ ] Unit: cache wrapper set/get/del behaves as expected (mock Redis)
- [ ] Integration: end-to-end test where endpoint returns cached value on second request

Manual/QA checks:
- [ ] Verify metrics: cache_hits_total increases and cache_misses_total decreases after warm-up
- [ ] Verify latency improvement on the offers endpoint (percentile P95 decreased)
- [ ] Verify correct cache TTL and invalidation on content update

Security and Privacy tests:
- [ ] Verify no PII is cached (add guards to scrub PII before caching)


### Traceability Matrix

Map Functional Requirements (RF) to Non-Functional Requirements (RNF) and affected components. Use this to determine where to act if an RNF fails.

| RF ID | RF Description | RNF | Component(s) Impacted | Notes |
|-------|----------------|-----|-----------------------|-------|
| RF-001 | List Products | Performance (P95 < 100ms) | product-service, redis | Cache reduces DB load |
| RF-002 | Create Offer | Ability to Rollback | product-service, infra | Migration guarded by feature flag |

Add rows as needed. For ADRs that change DB schema, add explicit migration IDs and rollback steps.


### Effort Estimate / How Much

Provide time estimates by role. Be conservative with risk factors and include QA/DevOps time.

Example:

Development Team:
- Implement cache wrapper and DI: 2h
- Integrate in endpoint and update unit tests: 3h
- Integration tests & local validation: 2h

QA Team:
- Automated tests and Playwright/JMeter setup: 6h
- Manual validation and evidence collection: 2h

DevOps:
- Provision Redis (IaC): 1h
- Deploy changes to staging & production rollout: 1h

Contingency (20%): add to total


---

## Example ADR: Redis Application Cache (short example)

- Status: Accepted
- Date: 2025-11-11
- Owners: Platform Team: Alice Example <alice@example.com>
- Links: ISSUE-123, PR-456, Grafana dashboard: https://grafana.example.com/d/abcd

### Context
Observed traffic spikes on offers endpoint producing DB contention; Grafana shows P95 latency growth from 80ms to 220ms on spike days.

### Decision
Use Redis for shared application-layer caching. TTL default 7 days for product list responses.

### Alternatives
... (see previous section)

### Consequences
Reduced DB load and improved latency; increased infra cost and need to secure Redis.

### Implementation Plan
- [ ] Create PR adding redis package and cache wrapper
- [ ] Add Prometheus metrics and Grafana panel

### Tests
- [ ] Unit and integration tests; verify metrics after rollout

### Traceability
See above for matrix rows.

### Effort
See effort table above.


---

## Helpful Notes for AI-related ADRs

- Always include data handling: what data can be sent to third-party models, how long conversation history is stored, PII handling rules, and consent mechanisms.
- List required secrets and where they should be configured (CI/CD secrets scope).
- Provide cost-estimation notes (expected per-call cost, expected traffic) and monitoring signals (latency, error rates, token consumption).


## Checklist before marking ADR Accepted

- [ ] Owners assigned and notified
- [ ] Related issues/PRs linked and referenced
- [ ] Implementation checklist added with responsible owners
- [ ] Tests and observability added
- [ ] Rollback plan defined and tested (if applicable)


---

If you'd like, I can:
- Generate a filled ADR for the MVP Chat feature (using the existing PDR content as input).
- Create issues/PR skeletons from the ADR implementation checklist.
- Generate SQL migration skeletons for the DB changes described in an ADR.

Indicate which action you'd like me to take next.
