# Aureon application work acceptance protocol

Authoritative development target: shep95/asherin.aureon. Do not modify shep95/aureonzorakcorp.

A task is only completed if:
1. It is matched to an exact original user request and accepted scope.
2. The actual Aureon application, not an isolated demo, includes the behavior.
3. Relevant unit, integration, security and UI checks pass.
4. Visual changes are inspected at desktop and mobile sizes against the supplied reference.
5. The requested GitHub commit and Vercel environment are verified separately.
6. Evidence identifies the tested commit, artifact, environment and result.
7. Blocked work remains blocked, never recast as done.

The plugin catalog (2,529 candidates) and the application feature backlog (previously described as 261, now referred to as roughly 220) must be reconciled from the original requests rather than guessed into a completed total. No agent, sandbox or script is inherently an independent LLM worker. Progress requires verifiable implementation.

Before modifying the deployed application, reconcile the Vercel source with the correct repository. Do not replace the working application with unrelated scaffolds.
