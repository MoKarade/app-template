# HANDOVER — app-template

## État

**C'est un template, pas une app.** Il ne se déploie pas et n'a pas de données. Son état
utile est donc : *qu'est-ce qu'un fork obtient aujourd'hui ?*

| Ce qui part avec le fork | État |
|---|---|
| `GET /hub/summary` conforme au contrat, jeton en temps constant, `no-store` | ✅ branché |
| Login Google (Auth.js v5) + middleware fail-closed | ✅ branché |
| Autorisation **par le hub** — deux étages, revérifiés à chaque lecture de session | ✅ branché (20/08/2026) |
| Cookie de session partagé sur `.hubperso.com` | ✅ branché (20/08/2026) |
| CI : gate (typecheck · lint · test · build) + job `audit` séparé | ✅ branché |
| Interface, moteur métier, base de données | ❌ à construire après le fork |

## Ce qu'un fork doit faire

La checklist fait foi : **`CLAUDE.md` § 11**. Elle est tenue là, pas ici, pour qu'il n'y en
ait qu'un exemplaire.

## Ce qui reste à poser sur le dépôt lui-même

- ⚠️ **Le dépôt n'a pas de branche `main`.** Sa branche par défaut s'appelle
  `claude/hopeful-lovelace-4d09zx` — un nom de session, pour la référence d'un template que
  d'autres dépôts forkent. À renommer en `main` (GitHub → Settings → Branches). Seul Marc
  peut le faire.
- `docs/adr/` est créé mais vide : le template n'a pas de décision architecturale propre,
  celles qui le concernent vivent dans l'ADR 0001 de Hubperso.

## Où lire la suite

- [`CLAUDE.md`](./CLAUDE.md) — comment on travaille ici, et la checklist de fork.
- [Convention de structure](https://github.com/MoKarade/claude-config/blob/main/conventions/STRUCTURE-DEPOT.md)
  — l'arborescence et le squelette de `CLAUDE.md`, communs aux huit dépôts.
- [ADR 0001 de Hubperso](https://github.com/MoKarade/Hubperso/blob/main/docs/adr/) — le
  modèle d'accès (connexion unique, autorisation par app).
