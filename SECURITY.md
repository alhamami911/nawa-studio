# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private reporting ("Security" tab → "Report a vulnerability") or contact the repository owner directly.

Include what you found, how to reproduce it, and the impact. You will get an acknowledgement as soon as possible.

## Secrets

This project handles an ElevenLabs API key, a recording account for the Nawa platform and an optional dashboard password. All of them live in a local `.env` that is git-ignored. If a secret is ever committed or pasted publicly, revoke it at the provider first, then clean up the repository.

## Scope

In scope: the production dashboard (authentication, remote access rules, data exposure) and the CI guards. Out of scope: the Nawa website itself and third-party services.
