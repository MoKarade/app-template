# app-template

Squelette d'app pour l'écosystème hub perso. Toute nouvelle app `<nom>.hubperso.com` part
d'ici. Deux choses sont déjà branchées et testées :

1. **`GET /hub/summary`** conforme au contrat
   [`@mokarade/hub-contract`](https://github.com/MoKarade/hub-contract), avec auth
   `x-hub-token` en temps constant — l'app apparaît dans le hub dès le premier déploiement,
   honnêtement « en construction » (`buildingSummary`).
2. **La session du hub** (Auth.js v5 sans fournisseur : l'app lit le cookie posé par
   `hubperso.com`, elle ne parle pas à Google) + proxy **fail-closed**, avec
   l'autorisation centralisée dans le hub (`lib/accesHub.ts`) — parce que ces apps affichent
   des données personnelles réelles, et que les apps existantes ont toutes fini par avoir
   besoin exactement de ça.

> Ce template condense ce que **Hubperso, FinanceAI, DriveAI, BatchChef et JobAI** ont
> appris en production. Les avertissements ⚠️ viennent de vrais bugs.

## Ce qui est déjà branché

| Fichier | Rôle |
|---|---|
| `app/hub/summary/route.ts` | Endpoint du hub : 503 sans `HUB_TOKEN`, 401 sans jeton valide, `no-store`, summary `building` |
| `lib/hubToken.ts` | Comparaison de jeton en temps constant (SHA-256 + `timingSafeEqual`) |
| `auth.ts` | Auth.js v5, `providers: []` (session du hub). **Deux étages** : le propriétaire (`AUTHORIZED_EMAIL`, sans réseau) puis le hub. Revérifié à chaque lecture de session |
| `lib/decisionAcces.ts` | L'ordre des deux étages, écrit une fois (utilisé par `auth.ts` et `lib/session.ts`) |
| `lib/session.ts` | `requireSession()` : revérification côté serveur dans chaque page ou Server Action |
| `lib/sessionAsymetrique.ts` | Vérifie le cookie signé du hub (`@mokarade/hub-contract/session`, clés publiques seulement) |
| `lib/connexionHub.ts` | Où renvoyer quelqu'un sans session : le `/login` du hub, avec un retour interne seulement |
| `lib/accesHub.ts` | `POST /api/acces` vers le hub, cache 60 s **positifs seulement**, échec fermé |
| `lib/sessionPartagee.ts` | Cookie de session sur `.hubperso.com` → connexion unique entre les apps |
| `proxy.ts` (ex-`middleware.ts`, renommé par Next 16) | Garde global fail-closed ; exclut `/hub/summary` (auth par jeton) |
| `lib/authGuard.ts` | Décision de garde en fonctions **pures**, testables |
| `lib/authConfigured.ts` | Refuse tout si `AUTH_SECRET`/`AUTHORIZED_EMAIL` manquent |
| `app/login/page.tsx` | Page publique : renvoie au hub ; messages d'erreur honnêtes et distincts |
| `tests/` | Contrat, garde d'accès, accès hub (le compte fait foi : `npm run test`) |
| `.github/workflows/ci.yml` | Gate (typecheck · lint · test · build) + job `audit` séparé, portes qualité et sécurité |
| `.mergify.yml` | Fusion automatique (Mergify) : fusionne en squash une PR hors brouillon dont Gate, Qualité et Sécurité sont verts |

## ⚠️ Les deux pièges à ne pas rejouer

**`/hub/summary` doit rester hors du proxy d'auth utilisateur.** Il porte sa propre
auth. S'il tombe derrière la session, le hub reçoit une redirection HTML au lieu du JSON →
widget « injoignable » en permanence, alors que l'app marche parfaitement dans ton
navigateur. JobAI l'a appelé « le défaut n°1 du squelette ». Verrouillé par `tests/auth.test.ts`.

**Le hub polle toutes les ~15 s.** S'il coûte quelque chose de borné de produire ton summary
(Apps Script, API tierce, requête lourde), mets un cache court **dans ton handler** — le hub
ne peut pas deviner ce que ça te coûte. DriveAI a découvert que 19 polls sur 20 renvoyaient
des octets identiques, chacun facturé sur un quota dur. Ne jamais mettre une **panne** en cache.

## Forker une nouvelle app

1. **Cloner** ce template sous un nouveau repo (ou « Use this template » sur GitHub).
2. **Personnaliser l'identité** dans `app/hub/summary/route.ts` :
   ```ts
   const APP = {
     id: "mon-app",              // kebab-case, stable — doit matcher lib/sources.ts du hub
     name: "Mon App",            // 1 à 30 caractères
     url: "https://mon-app.hubperso.com",
     color: "#e11d48",           // hex 6 digits
   };
   ```
   puis le `<title>` dans `app/layout.tsx` et le contenu de `app/page.tsx`.
3. **Configurer l'environnement** — voir [`.env.example`](./.env.example).
4. **Déclarer l'app au hub** : entrée dans `lib/sources.ts` du repo Hubperso + variable
   `HUB_TOKEN_<ID>`. ⚠️ C'est du **code** côté hub → redéploiement du hub nécessaire, pas
   seulement une variable d'environnement.
   Cette entrée fait DEUX choses : elle affiche le widget de l'app, **et** elle la fait
   apparaître dans `hubperso.com/administration` (`APPS_DISPONIBLES` dérive de
   `SOURCE_DEFS`). Sans elle, personne ne peut se voir accorder l'accès à la nouvelle app
   — seul le propriétaire entrerait, et ça ressemblerait à un bug d'autorisation.
5. **Construire l'app.** Quand le moteur produit de vraies données, remplacer
   `buildingSummary(APP, …)` par un vrai `HubSummary`, validé par `validateSummary(...)`.
6. **Si l'app a une base** : voir « Migrations » plus bas.
7. **Créer `HANDOVER.md` et `BACKLOG.md`** dès la première session.

## Auth

Deux authentifications indépendantes, qui ne se recouvrent pas :

| | Qui | Mécanisme | Échec |
|---|---|---|---|
| **Hub → app** | le hub, server-side | header `x-hub-token` | 503 si `HUB_TOKEN` absent, 401 si invalide |
| **Toi → app** | navigateur | session posée par le hub (connexion Google faite chez lui), puis autorisation demandée au hub | 503 si non configurée, redirection `/login` (→ hub) sinon |
| **App → hub** | l'app, server-side | `POST /api/acces` avec le même `HUB_TOKEN` | `false` (échec fermé) — sauf le propriétaire, qui ne passe pas par là |

```bash
# jeton du hub
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
# secret Auth.js
npx auth secret
```

⚠️ **Fail-closed voulu** : sans `AUTH_SECRET`/`AUTHORIZED_EMAIL`, le proxy répond 503 et
ne sert RIEN. Auth.js seul se contente de logguer `MissingSecret` et **laisse passer** —
constaté en préproduction sur le hub, qui servait ses données sans login.

⚠️ **`AUTHORIZED_EMAIL` est le PROPRIÉTAIRE, pas une allowlist.** Il ouvre tout, toujours,
et **sans toucher au réseau** : c'est l'échappatoire qui garantit qu'une panne du hub ne
t'enferme pas dehors de ta propre app. Les autres personnes vivent dans la table `acces` du
hub et se gèrent depuis `hubperso.com/administration` — jamais en éditant une variable ici.

⚠️ **`AUTH_SECRET` doit être IDENTIQUE dans toutes les apps du hub**, et
`AUTH_COOKIE_DOMAIN=.hubperso.com` ne se pose **qu'en production** : un cookie portant ce
domaine est rejeté sur `localhost` et sur `<projet>.vercel.app`, et il l'est
**silencieusement** — on retombe sur `/login` en boucle, sans erreur nulle part.

## Migrations : rien à lancer sur ton PC

Exigence de Marc, non négociable. Deux patrons éprouvés, au choix :

- **Au déploiement** (BatchChef) : ajouter `"vercel-build": "npm run db:migrate && next build"`.
  Vercel utilise ce script à la place de `build` quand il existe → les migrations s'appliquent
  à chaque déploiement, prod et previews. Idempotent (table de suivi Drizzle).
- **Au démarrage de l'app** (JobAI, `lib/migrations.ts`) : mémorisé par processus, n'échoue
  jamais vers l'appelant. À préférer si l'app doit aussi se réparer hors déploiement.

## CORS : rien à faire

Le hub fetch `/hub/summary` **server-side**. Aucun header CORS à configurer — si le besoin
apparaît, c'est le signe qu'un fetch est parti côté client, ce qui exposerait le jeton.

## Développement

```bash
npm install
npm run dev        # http://localhost:3000  (endpoint : /hub/summary)
npm run test       # vitest (contrat + garde d'accès)
npm run typecheck  # tsc --noEmit
npm run lint
npm run build

# tester le endpoint en local
HUB_TOKEN=dev npm run dev
curl -s -H "x-hub-token: dev" http://localhost:3000/hub/summary
```

Avant chaque commit : `npm run typecheck && npm run lint && npm run test && npm run build`.

## Déploiement

Vercel (ou tout hôte Next.js). Définir `HUB_TOKEN`, `AUTH_SECRET`, `AUTHORIZED_EMAIL`, et en **production seulement**
`AUTH_COOKIE_DOMAIN=.hubperso.com` (`HUB_SESSION_PUBLIC_KEYS` quand le hub publie ses clés). Domaine cible : `<nom>.hubperso.com` — et pas une
adresse en `.vercel.app` : un cookie ne franchit pas la frontière entre deux domaines, donc
la connexion unique ne marcherait pas.

`AUTH_SECRET` doit être **la même valeur que dans les autres apps du hub**. Avec un secret
différent, l'app reçoit bien le cookie partagé mais n'arrive pas à le déchiffrer : elle
renvoie sur `/login`, l'utilisateur se reconnecte, et ça recommence.

Rien à déclarer côté Google Cloud : l'app n'a plus de client OAuth, la connexion Google se
fait sur le hub (ADR 0001 du hub). Corollaire : en local, l'app seule ne peut pas ouvrir de
session — `/login` renvoie au hub.

⚠️ Pour l'instant le proxy ne lit que la session Auth.js (cookie chiffré) ; le cookie
signé du hub n'est lu que par `requireSession()`. Tant que le hub n'émet pas ce cookie, rien
ne change en production.

## Version du contrat

Au 15/10/2026 (`package.json`) : `@mokarade/hub-contract` est épinglé sur le **tag `v1.4.0`**
(additif : sous-chemin `/session`, lu par `lib/sessionAsymetrique.ts`). Ne jamais redescendre sous `v1.3.1`,
premier tag qui livre `dist/` commité (indispensable sous Node 24 + `--ignore-scripts`) : les
clés inconnues sont strippées sans erreur.
*(Historique : jusqu'au 23/09 le template épinglait un SHA, faute de tag poussé.)*
