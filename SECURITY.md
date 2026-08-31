# Security Policy

## What these projects are

Shiplo Showcase projects are demonstration and reference implementations.
They are **not** security audits and **not** production-readiness
guarantees. A showcase passing this repository's own checks has had:

- a clean dependency install and a successful production build;
- a dependency security review (`npm audit` reviewed, findings triaged);
- a manual review for secrets, private data, unsafe dynamic execution,
  unnecessary runtime network calls and sensitive browser storage;
- a console and static-asset review of the production build.

That is the *definition of done for a demo*. It is a floor, not a ceiling.

If you adapt a showcase for production, you are responsible for reviewing
and hardening it for your own threat model, dependencies, privacy
requirements, compliance obligations, user data and deployment
environment.

## Before production use

At minimum:

- update and review dependencies;
- run your own security testing;
- validate any untrusted inputs that you add;
- review browser security headers and CSP;
- remove demo/debug behavior;
- review storage and privacy behavior;
- review applicable legal and regulatory requirements.

## Reporting a vulnerability

Prefer GitHub private vulnerability reporting / a private security advisory
when enabled for the repository. Avoid publishing exploit details before
maintainers have had a reasonable opportunity to investigate.

Do not include credentials, private customer data or unrelated sensitive
information in a report.
