# HANDOVER — app-template

## 26/10/2026 — lia-ui v0.41.1, la bulle ne dépasse plus de l'écran (app-template#171)

Le gabarit épingle `@mokarade/lia-ui` v0.41.1 (sha pelé `90dc7e7`), seul changement (`package.json`, lock). Le relevé du PC sur v0.41.0 montrait la bulle hors écran à l'ouverture et à l'arrivée de la réponse, puis un saut. v0.41.1 place sans glisser quand la taille ou l'écran change et fait grandir la bulle vers le haut dans la moitié basse. Rien à brancher. Sans déploiement (gabarit) : preuve par typecheck, tests et build sur le commit fusionné.

## 26/10/2026 — lia-ui v0.41.0, sources cliquables et chat en bulle lissée (app-template#166)

Le gabarit épingle `@mokarade/lia-ui` v0.41.0 (sha pelé `4d0c6f9`), seul changement (`package.json`, lock). v0.40.0 : les marques `[→lien]` d'une réponse de LIA deviennent une ligne « Sources » de petits liens (https, sans identifiants). v0.41.0 : le chat ne se replace plus à chaque image, reste dans l'écran visible (clavier du téléphone compris), glisse vers sa place, ne bouge pas quand le texte arrive. Retours de Marc du 26/10 : « incompréhensible, trop de texte, pas de liens » et « clunky, ça bug quand ça sort de la page ». Rien à brancher côté app. Preuve : sans déploiement (le gabarit ne se déploie pas) ; `npm ci && npm run typecheck && npm run test` verts avec lia-ui en 0.41.0.

## 26/10/2026 — LIA partage son état unique avec le hub, lia-ui v0.39.0 (app-template#158)

Une seule LIA, un seul état (Marc, 23/10/2026) : le squelette démarrait LIA sans l'option `etat`, donc chaque fork repartait d'un état local, différent du hub. Ajouts : `GET|PUT /api/lia/etat` (`app/api/lia/etat/route.ts`, derrière le proxy ET `requireSession()`), qui relaie le `/api/lia/etat` du hub avec le cookie de session de l'utilisateur, jamais `HUB_TOKEN` (`lib/lia/etat.ts` jugement pur, `etatHub.ts` appel https, `hubCookie.ts` suit la redirection `hubperso.com` vers `www`, sinon Node perd le cookie). `LiaMontee` passe `etat: creerEtatInvite(session, etatHttp("/api/lia/etat"))` : un invité n'appelle rien. Pin **v0.39.0** (commit `5449056`) : `validerEtat` garde `discussion` (20 messages de 600 caractères, 4 000 au total, fermée = sans texte), donc la discussion de Marc suit d'une app à l'autre. Tests : `tests/lia.etat.test.ts`, `lia.hubCookie.test.ts`, `lia.askInvite.test.ts`, `liaMontee.test.ts`, `proxy.test.ts` (la route reste gardée). Aucun déploiement : un squelette ne se déploie pas.

## 26/10/2026 — lia-ui remis à v0.38.0 (app-template#159)

Dependabot (#155, fusionnée le 26/10 à 01:50Z) avait rétrogradé `@mokarade/lia-ui` de v0.38.0 à **v0.31.0** : il lit mal les tags, comme pour `@mokarade/hub-contract`. Re-pin à **v0.38.0** (commit `9faf1ac`, package.json et lockfile) et `@mokarade/lia-ui` ajouté aux `ignore` de `.github/dependabot.yml` : le re-pin se fait à la main à chaque version. Aucun changement de code.

## État au 15/10/2026

- **Ce qui tourne** : rien n'est déployé (c'est un squelette). Branche par défaut : **`main`**
  (mesuré : `git ls-remote --symref origin HEAD`). Pile au 16/10 (`package.json`) : Next.js
  16.3.5, Auth.js v5 bêta, Zod 4, Vitest 5, `@mokarade/hub-contract` épinglé sur le tag
  `v1.5.0` (#82).
- **Livré depuis la dernière mise à jour de ce fichier** (d'après `git log`, dernier commit le
  24/09) : Node 24 + fusion automatique (#12), re-pin `v1.3.1` (#13), portes qualité S6 (#14),
  Next 15 → 16.3.5 (#19), Zod 3 → 4 (#18), Vitest 5 et couverture recalibrée (#20),
  mises à jour Dependabot (#15, #17), CI sur le runner du PC (#22), fusion par Mergify à la
  place de l'auto-merge maison (#29), re-pin `v1.4.0` (#33), re-pin `v1.5.0` (#82, zod 4 dans le contrat).
- **Fusion** : Mergify (`.mergify.yml`, depuis le 15/10, #29) ; l'auto-merge maison
  (`auto-merge.yml` + `scripts/autoMerge.mjs`) est retiré. Les PR qui touchent `.github/`,
  `scripts/hooks/`, `qualite/`, `vercel.json`, `drizzle/` ou `.env*` restent fusionnées par Marc.
- **CI** : tous les workflows tournent sur `ubuntu-latest` (machines GitHub, gratuites sur un dépôt public), depuis la bascule en public (16/10/2026, tâche #36) ; le robot du PC ne sert plus ce dépôt. ⚠️ Un fork **privé** n'a pas de minutes Actions gratuites : il doit rester public, ou rebrancher un runner à lui.
- **Risque accepté** : alerte `braces` 3.0.3 (GHSA-vfj7-8cjw-p6xm, dépendance de développement, aucun correctif publié), tolérée par Marc le 16/10/2026 dans `osv-scanner.toml`, à réexaminer au 16/01/2027.
- **LIA (22/10/2026)** : `@mokarade/lia-ui` branché, épinglé sur v0.39.0 depuis le 26/10/2026 (même mouvement et même pastille d'humeur que le hub, réglages du paquet ; verrou `tests/liaMontee.test.ts` ; LIA démarrée par `demarrerLia` hors du rendu ; présente aussi sur `/login` et `global-error` en mode invité, `ask` refusé sans session, 24/10/2026) (route `/api/lia/ask`, `lib/lia/`, layout). Sans la route `POST /api/lia/ask` du hub (qui relaie à MemoryAI), LIA vit mais répond « indisponible » (échec fermé). Détail : `docs/claude/13-lia.md`.
- **En cours** : rien.
- **Gel décidé par Marc le 14/10 : aucun nouveau travail sur les apps tant que le plan de
  réduction du temps des PR est en cours.**

## Ce qu'un fork obtient

**C'est un template, pas une app.** Il ne se déploie pas et n'a pas de données. Son état
utile est donc : *qu'est-ce qu'un fork obtient aujourd'hui ?*

| Ce qui part avec le fork | État |
|---|---|
| `GET /hub/summary` conforme au contrat, jeton en temps constant, `no-store` | ✅ branché |
| Session du hub (Auth.js v5, `providers: []`) + proxy fail-closed | ✅ branché (15/10/2026, tâche #30 ; plus de client Google dans le fork) |
| Autorisation **par le hub** — deux étages, revérifiés à chaque lecture de session | ✅ branché (20/08/2026) |
| Cookie de session partagé sur `.hubperso.com` | ✅ branché (20/08/2026) |
| CI : gate (typecheck · lint · test · build) + job `audit` séparé | ✅ branché |
| Portes qualité S6 (cliquet, gitleaks, Semgrep) | ✅ branché (23/09/2026) |
| Socle visuel commun : jetons de couleur clair/sombre, `.carte` `.bouton` `.champ`, cibles ≥ 44 px (`app/globals.css`, verrou `tests/theme.test.ts`) | ✅ branché (15/10/2026, tâche #39) |
| Seule `main` se déploie sur Vercel, aucune préversion (`vercel.json`, verrou `tests/vercel.test.ts`) | ✅ branché (16/10/2026, tâche #41) |
| Gate rouge tant que `APP.id` vaut encore `app-template` (`tests/forkIdentite.test.ts`) | ✅ branché (15/10/2026, tâche #24) |
| `CLAUDE.md` de 60 lignes au plus, détail dans `docs/claude/` (`tests/claudeMd.test.ts`) | ✅ branché (16/10/2026, tâche #31) |
| LIA : corps animé, chat et menu (`@mokarade/lia-ui` épinglé par tag), question relayée à MemoryAI, échec fermé | ✅ branché (22/10/2026) |
| Contrôles communs de `MoKarade/.github` appelés par la CI : sécurité (`securite-commune`), grille de conformité (`conformite`, tableau dans le résumé du job) et fumée de production (`fumee.yml`, déclenchée par un déploiement : jamais ici, le squelette n'est pas déployé) | ✅ branché (16/10/2026, tâche #37) |
| Fusion automatique par Mergify (`.mergify.yml`) | ✅ branché (15/10/2026) — voir « État au 15/10 » |
| Suivi des erreurs : Sentry (`instrumentation.ts`, `instrumentation-client.ts`, `lib/sentryConfig.ts`), éteint sans `SENTRY_DSN`, aucune donnée personnelle (verrou `tests/sentryConfig.test.ts`) ; essai manuel : workflow « Essai Sentry » | ✅ branché (16/10/2026, tâche #40) |
| Interface, moteur métier, base de données | ❌ à construire après le fork |

## Ce qu'un fork doit faire

La checklist fait foi : **[`docs/claude/11-fork.md`](./docs/claude/11-fork.md)**. Elle est tenue là, pas ici, pour qu'il n'y en
ait qu'un exemplaire.

## Ce qui reste à poser sur le dépôt lui-même

- ~~Le dépôt n'a pas de branche `main`~~ — *historique* : réglé, la branche par défaut est
  `main` (constaté le 15/10/2026).
- `docs/adr/` est créé mais vide : le template n'a pas de décision architecturale propre,
  celles qui le concernent vivent dans l'ADR 0001 de Hubperso.

## Où lire la suite

- [`CLAUDE.md`](./CLAUDE.md) — comment on travaille ici (court) ; le détail et la checklist de fork sont dans [`docs/claude/`](./docs/claude/).
- [Convention de structure](https://github.com/MoKarade/claude-config/blob/main/conventions/STRUCTURE-DEPOT.md)
  — l'arborescence et le squelette de `CLAUDE.md`, communs aux huit dépôts.
- [ADR 0001 de Hubperso](https://github.com/MoKarade/Hubperso/blob/main/docs/adr/) — le
  modèle d'accès (connexion unique, autorisation par app).

## Portes qualité de l'Atelier (S6, 23/09/2026)

Contrôles automatiques en CI, jobs **Qualité** et **Sécurité** : la fusion automatique les attend.
Principe du **cliquet** : `qualite/seuils.json` fige l'état du jour de la mise en place ; rien ne peut
reculer. `npm run portes` mesure en local, `npm run portes:maj` resserre après une amélioration.

| Porte | Seuil (mesuré le 24/09/2026, recalibré avec Vitest 5) |
|---|---|
| Typage (erreurs) | ≤ 0 |
| Lint (erreurs) | ≤ 0 |
| Lint (avertissements) | ≤ 2 |
| Tests en échec | ≤ 0 |
| Couverture `lib/` (% lignes) | ≥ 84.8 |
| Couverture globale (% lignes) | ≥ 69.8 |
| Couverture globale (% branches) | ≥ 71.6 |
| Code mort (knip) | ≤ 3 |
| Règles d'architecture (dependency-cruiser) | ≤ 0 |

**Où lire la couverture.** Sur la page de chaque exécution de la CI (job « Qualité », résumé en bas) : mesure,
seuil et statut de chaque porte. Aucun chiffre cible n'est fixé (décision de Marc, 15/10/2026) : le seuil part
de la mesure et ne fait que monter (`npm run portes:maj`). Une PR qui fait baisser un de ces chiffres rend le
job « Qualité » rouge, et la fusion automatique l'attend.

Sécurité : gitleaks sur l'historique qui serait fusionné (HEAD) + Semgrep (TypeScript, React, Next.js,
secrets, OWASP), bloquants.
Dependabot : mises à jour hebdomadaires (npm + actions), fusion automatique si tout est vert.

**Au fork.** Les seuils ci-dessus sont ceux du SQUELETTE : le cliquet s'applique dès la première PR de
l'app — c'est voulu, une app neuve naît testée. Si le fork change de structure (pas de `lib/`, un
dossier `components/` qui apparaît), ajuster le bloc `config` de `qualite/seuils.json` (`coeur`,
`archi`) ; desserrer un seuil reste une décision de Marc (`--forcer`).
