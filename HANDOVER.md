# HANDOVER — app-template

## État au 14/10/2026

- **Ce qui tourne** : rien n'est déployé (c'est un squelette). Branche par défaut : **`main`**
  (mesuré : `git ls-remote --symref origin HEAD`). Pile au 14/10 (`package.json`) : Next.js
  16.3.5, Auth.js v5 bêta, Zod 4, Vitest 5, `@mokarade/hub-contract` épinglé sur le tag
  `v1.3.1` (le dernier tag est `v1.4.0`, qui n'ajoute que `/session` : pas de re-pin requis).
- **Livré depuis la dernière mise à jour de ce fichier** (d'après `git log`, dernier commit le
  24/09) : Node 24 + fusion automatique (#12), re-pin `v1.3.1` (#13), portes qualité S6 (#14),
  Next 15 → 16.3.5 (#19), Zod 3 → 4 (#18), Vitest 5 et couverture recalibrée (#20),
  mises à jour Dependabot (#15, #17).
- **Fusion** : auto-merge maison `.github/workflows/auto-merge.yml` + `scripts/autoMerge.mjs`
  (décision pure, testée par `tests/autoMerge.test.ts`) ; pas de `CODEOWNERS`. Le parc a
  basculé sur la fusion native le 01/10 (Hubperso, CarAI, MemoryAI, DriveAI), pas ce dépôt —
  un fork hérite donc du kit maison. ⚠️ À trancher par Marc (14/10) : aligner ou non le
  squelette.
- **En cours** : rien.
- **Gel décidé par Marc le 14/10 : aucun nouveau travail sur les apps tant que le plan de
  réduction du temps des PR est en cours.**

## Ce qu'un fork obtient

**C'est un template, pas une app.** Il ne se déploie pas et n'a pas de données. Son état
utile est donc : *qu'est-ce qu'un fork obtient aujourd'hui ?*

| Ce qui part avec le fork | État |
|---|---|
| `GET /hub/summary` conforme au contrat, jeton en temps constant, `no-store` | ✅ branché |
| Login Google (Auth.js v5) + middleware fail-closed | ✅ branché |
| Autorisation **par le hub** — deux étages, revérifiés à chaque lecture de session | ✅ branché (20/08/2026) |
| Cookie de session partagé sur `.hubperso.com` | ✅ branché (20/08/2026) |
| CI : gate (typecheck · lint · test · build) + job `audit` séparé | ✅ branché |
| Portes qualité S6 (cliquet, gitleaks, Semgrep) | ✅ branché (23/09/2026) |
| Auto-merge maison (`auto-merge.yml` + `scripts/autoMerge.mjs`) | ✅ branché (23/09/2026) — voir « État au 14/10 » |
| Interface, moteur métier, base de données | ❌ à construire après le fork |

## Ce qu'un fork doit faire

La checklist fait foi : **`CLAUDE.md` § 11**. Elle est tenue là, pas ici, pour qu'il n'y en
ait qu'un exemplaire.

## Ce qui reste à poser sur le dépôt lui-même

- ~~Le dépôt n'a pas de branche `main`~~ — *historique* : réglé, la branche par défaut est
  `main` (constaté le 14/10/2026).
- `docs/adr/` est créé mais vide : le template n'a pas de décision architecturale propre,
  celles qui le concernent vivent dans l'ADR 0001 de Hubperso.

## Où lire la suite

- [`CLAUDE.md`](./CLAUDE.md) — comment on travaille ici, et la checklist de fork.
- [Convention de structure](https://github.com/MoKarade/claude-config/blob/main/conventions/STRUCTURE-DEPOT.md)
  — l'arborescence et le squelette de `CLAUDE.md`, communs aux huit dépôts.
- [ADR 0001 de Hubperso](https://github.com/MoKarade/Hubperso/blob/main/docs/adr/) — le
  modèle d'accès (connexion unique, autorisation par app).

## Portes qualité de l'Atelier (S6, 23/09/2026)

Contrôles automatiques en CI, jobs **Qualité** et **Sécurité** : la fusion automatique les attend.
Principe du **cliquet** : `qualite/seuils.json` fige l'état du jour de la mise en place ; rien ne peut
reculer. `npm run portes` mesure en local, `npm run portes:maj` resserre après une amélioration.

| Porte | Seuil de départ |
|---|---|
| Typage (erreurs) | ≤ 0 |
| Lint (erreurs) | ≤ 0 |
| Lint (avertissements) | ≤ 2 |
| Tests en échec | ≤ 0 |
| Couverture `lib/` (% lignes) | ≥ 69.4 |
| Couverture globale (% lignes) | ≥ 48.9 |
| Couverture globale (% branches) | ≥ 94.2 |
| Code mort (knip) | ≤ 3 |
| Règles d'architecture (dependency-cruiser) | ≤ 0 |

Sécurité : gitleaks sur l'historique qui serait fusionné (HEAD) + Semgrep (TypeScript, React, Next.js,
secrets, OWASP), bloquants.
Dependabot : mises à jour hebdomadaires (npm + actions), fusion automatique si tout est vert.

**Au fork.** Les seuils ci-dessus sont ceux du SQUELETTE : le cliquet s'applique dès la première PR de
l'app — c'est voulu, une app neuve naît testée. Si le fork change de structure (pas de `lib/`, un
dossier `components/` qui apparaît), ajuster le bloc `config` de `qualite/seuils.json` (`coeur`,
`archi`) ; desserrer un seuil reste une décision de Marc (`--forcer`).
