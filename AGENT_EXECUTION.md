# Aureon execution contract

This repository is the intended public code destination for Aureon, not proof that a deployment is connected to GitHub.

## Workstreams

- Existing application: preserve the latest Vercel `aureon-landing` deployment source and verify feature acceptance against the full `aureon-task-ledger.json`.
- Research and integrations: country-aware provider discovery, sourced API registry, explicit auth scopes, rate limits, regional eligibility, connector health checks, provider-specific test fixtures.
- Plugin creation: validated plugin manifests, versioning, deterministic packaging, secret references (never embedded API keys), isolated execution, approval before external effects, observable tests.
- Agent orchestration: durable queued jobs, idempotency, task dependencies, retries, permission gates, sandboxed cloud jobs, actual execution logs, artifacts, and fail-closed state transitions.
- QA: build, unit, integration, accessibility and responsive checks, security tests, and production smoke tests.
- Release: only promote reviewed, tested builds. Preserve user-requested sequence: remove Relationship Atlas from landing page only after earlier workstreams are verified complete.

## Success rules

A task is not complete because a checklist says so. Each completion needs a commit or deployment identifier, reproducible test outcome, and timestamp. Unavailable provider APIs, region restrictions and missing user authorization are blocking conditions, not simulated success. Avoid invented agent activity.

## Current verified infrastructure (2026-10-27)

Vercel project: `prj_lVZ6WKdLh0J0RL69NQuXAyzdK1TA` (`aureon-landing`), team `houseofasher`.
Most recent inspected ready deployment: `dpl_55x8nMDwd9pGaZvMwGVMkNm5z8by`.
The deployed source contains a task ledger and planning documents. The planning and cloud-terminal document identifies those capabilities as specified, not implemented. No active sandbox sessions were found; previous sandboxes were stopped. No eve-framework agent runs were found in the inspected seven-day preview and production windows. These observations do not establish whether other previous task agents completed work.

## Security boundaries

Provider credentials belong in a server-side secret store. Never place API keys in a repository, client bundle or log. Require explicit authorization and narrow scopes for sensitive actions; apply per-provider quotas, network allowlists, and audit logging. Never claim universal access to every country or digital asset.
