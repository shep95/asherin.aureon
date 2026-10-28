# Aureon plugin agent pipeline
Updated 2026-10-27. This is the execution contract for new plugin jobs. Vercel sandbox workers execute commands and tests; they are not self-directed LLM agents.

## Mandatory sequence
research -> create plan -> optimize plan -> code -> test -> narrative flaw analysis -> narrative patch proposal -> patch code -> retest -> visual quality review -> release gate.

## Role boundaries
1. Research: collect official API documentation, terms, regional restrictions, provenance, authentication methods and capability claims.
2. Planner: choose provider scope, permission model, data contracts, rate-limit handling, error states and tests; optimize by identifying the smallest complete integration with highest reliability.
3. Builder: implement a real provider-specific client. No sample-only responses, fake login success or secret values.
4. QA: execute unit and permitted live integration tests, examine security and failure paths.
5. Narrative reviewer: translate code behavior into an explicit prose description of inputs, transformations, outputs, assumptions, and failure modes; log flawed claims before proposing a correction.
6. Patch: edit code and test cases, then run the QA step again, up to a declared retry budget. Mark failures blocked rather than pass them.
7. Visual QA: inspect actual desktop/mobile renders; require accessibility, consistent brand typography and spacing, usable loading/error/connection states and no overflow. Missing UI is not visual pass.
8. Release: require final test evidence, approved credentials and scopes, environment ownership and deploy target; do not publish automatically.

## Observed first cycle
World Bank adapter: public `SP.POP.TOTL` for US 2020 returned 331578104 from the live upstream endpoint, confirmed by Vercel sandbox run. 11 repository tests passed before review.
Narrative flaw: `connected: true` described a successful public fetch as if an account integration were connected.
Narrative correction: represent `liveData: true` and `accountConnection: false` explicitly.
Patch: source updated in GitHub commit `adf38e6`. Retest required before marking the patch verified.
Visual QA: blocked because repository contains only backend/plugin source; the earlier Aureon UI must be imported or inspected at the deployed application. No claim of aesthetic perfection.

## Evidence gate
Every provider must include URLs, conditions of use, credential type, region assumptions, functional tests, observable error behavior, a narrative code review, patch evidence, and final visual QA if it has a UI. API catalog entries are discovery leads and must not be counted as installed plugins. An unlimited architectural factory does not grant unlimited provider access, API credentials, funds or runtime.
