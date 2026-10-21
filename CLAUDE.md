# CLAUDE.md — app-template

## Contexte
- Squelette d'app de l'écosystème hub perso : expose `GET /hub/summary` conforme à [`@mokarade/hub-contract`](https://github.com/MoKarade/hub-contract) et reste **privée** (connexion et autorisation centralisées dans le hub). L'interface et le moteur métier se construisent après le fork.
- Stack (source : `package.json`) : Next.js 16 (App Router) · Auth.js v5 (`providers: []`, session du hub) · Zod 4 · TypeScript strict · Vitest 5. Destination : `<nom>.hubperso.com`.
- Condense ce que les cinq apps ont appris en production ; chaque ⚠️ vient d'un vrai bug. **Au fork, commencer par `docs/claude/11-fork.md`.**
- État : `HANDOVER.md` (à lire en premier) ; plan : les issues du dépôt (`BACKLOG.md` n'est qu'un renvoi) ; décisions : `docs/adr/`.

## Commandes
- `npm run dev` · `npm run test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npm run portes`.
- Gate avant commit : `npm run typecheck && npm run lint && npm run test && npm run build`. Détail : `docs/claude/04-commandes.md`, `05-verifications.md`.
- Graphe de code (hooks et MCP `graphify` posés, 0 jeton) : `graphify query|affected|path|explain` avant de grepper ou lire plusieurs fichiers ; `graphify-out/wiki/index.md` pour la vue d'ensemble. Détail : `docs/claude/12-graphe-code.md`.

## Règles propres au dépôt (détail : `docs/claude/01-principes.md`)
- **Contrat d'abord** : toute réponse de `/hub/summary` passe par le schéma du contrat ; le hub REJETTE ce qui dévie. `dataAsOf` ≠ `generatedAt`.
- **No fake data** : `status: "building"` par défaut, aucune métrique inventée, pas de bloc `usage` sans coût réel.
- **Échec fermé** : `x-hub-token` obligatoire (401), `HUB_TOKEN` absent → 503, comparaisons en temps constant, `no-store` sur `/hub/summary`, jamais de secret en dur.
- **Accès à deux étages** : `AUTHORIZED_EMAIL` = propriétaire (sans réseau), les autres via `aAccesHub` ; jamais d'allowlist locale. Un refus ne se met JAMAIS en cache.
- **L'app LIT la session du hub**, elle n'en crée pas. Contrôle rejoué à chaque lecture (`decideAcces`), `requireSession()` dans toute page et Server Action ; toute nouvelle route de données reste DERRIÈRE le proxy.
- **`/hub/summary` reste HORS du proxy d'auth utilisateur** (il porte son jeton) ; verrou `tests/auth.test.ts`, à ne pas supprimer.
- **`HUB_TOKEN` sert dans les deux sens** (entrant et sortant) ; aucun `appId` dans le corps. Période des coûts : `total`.
- **Socle visuel** : couleurs en variables dans `app/globals.css` et nulle part ailleurs, clair et sombre, cibles ≥ 44 px, champs à 16 px ; verrou `tests/theme.test.ts`.
- **Code** : TypeScript strict, pas de `any` silencieux, erreurs jamais avalées, fonctions pures d'un côté et I/O de l'autre. Planchers de version documentés dans `package.json` (clé `//`), jamais redescendus.
- **Doc** : mettre à jour la doc touchée dans la MÊME PR que le code ; un chiffre au présent se date ou renvoie à sa source.

## Git et CI
- Branches `claude/<slug>` (automatisé) ou `feature/<slug>` ; `git fetch origin main` AVANT de committer ; jamais `--force` sur `main`, jamais `--no-verify`. `--base main` explicite.
- PR en brouillon pour itérer ; Mergify fusionne en squash une PR sortie du brouillon, sans `hold`, quand Gate, Qualité et Sécurité sont verts. Un chemin protégé (`.github/`, `scripts/hooks/`, `qualite/`, `vercel.json`, `drizzle/`, `.env*`) passe aussi quand le « Garde-fou » est vert ; rouge, il attend Marc (issue `qui:marc`).
- Commits en français, préfixés (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Jobs CI bornés (`timeout-minutes`).
- Préversions Vercel coupées par `vercel.json` (seule `main` se déploie). Après un merge qui change ce qui est SERVI : vérifier le déploiement `READY`, puis la réponse réelle (`docs/claude/06-deploiement.md`).

## Pour aller plus loin (à lire seulement si nécessaire)
Ancien numéro de section de ce fichier → `docs/claude/` :
- § 1 principes → `01-principes` · § 2 conventions → `02-conventions` · § 3 git → `03-workflow-git` · § 4 commandes → `04-commandes` · § 5 vérifications → `05-verifications`
- § 6 déploiement → `06-deploiement` · § 7 intégration hub → `07-hub` · § 8 documentation → `08-documentation` · § 9 leçons → `09-lecons`
- § 10 style et compte-rendu → `10-style-compte-rendu` (copie lisible de la convention : `docs/COMPTE-RENDU.md`, non importée) · § 11 checklist de fork → `11-fork` · préambule → `00-preambule` · graphe de code → `12-graphe-code`
