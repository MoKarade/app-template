# CLAUDE.md — app-template

Squelette d'app de l'écosystème hub perso. Deux responsabilités génériques, déjà branchées :
exposer `GET /hub/summary` conforme à
[`@mokarade/hub-contract`](https://github.com/MoKarade/hub-contract), et rester **privée**
(login Google + autorisation centralisée dans le hub). Tout le reste — l'interface, le
moteur métier — se construit après le fork.

**Stack** : Next.js 15 (App Router) · Auth.js v5 · TypeScript strict · Vitest.
**Destination** : `<nom>.hubperso.com`.

> 📐 Structure de ce fichier et de `docs/` : [convention commune aux huit dépôts](https://github.com/MoKarade/claude-config/blob/main/conventions/STRUCTURE-DEPOT.md).
> Elle est écrite là et nulle part ailleurs.

> **Ce fichier condense ce que les cinq apps de l'écosystème ont appris en production**
> (Hubperso, FinanceAI, DriveAI, BatchChef, JobAI). Chaque avertissement marqué ⚠️ vient
> d'un vrai bug, pas d'une précaution théorique. Ce que ce fichier oublie, chaque fork
> l'oubliera.
>
> **Au fork, commence par la section 11.**

## 1. Principes non négociables

- **Contrat d'abord.** Toute réponse de `/hub/summary` passe par le schéma du contrat
  (`buildingSummary` le garantit ; au fork, `validateSummary(...)` sur un vrai summary).
  Le hub REJETTE ce qui dévie — il affichera « invalide », pas tes données.
- **No fake data.** Par défaut `status: "building"`, aucune métrique inventée. On ne publie
  de vrais chiffres que quand le moteur les produit réellement. Un `0` affirme ; une absence
  admet. Pas de bloc `usage` tant qu'il n'y a pas de coût réel.
- **Échec fermé, partout.** `x-hub-token` obligatoire (401 sinon) ; `HUB_TOKEN` absent
  → 503 (intégration désactivée, pas une panne) ; auth utilisateur non configurée → 503 et
  rien n'est servi. Comparaisons de jetons en **temps constant**. Jamais de secret en dur.
- **`no-store` systématique** sur `/hub/summary` : un summary est un instantané.
- **App privée par défaut.** Elle affiche des données personnelles → login Google +
  middleware fail-closed. Toute NOUVELLE route qui affiche des données reste DERRIÈRE le
  middleware.
- **Qui a le droit d'entrer : DEUX ÉTAGES, pas un seul** (ADR 0001 du hub).
  `AUTHORIZED_EMAIL` **n'est PAS « la seule adresse admise »** — c'est le **propriétaire**,
  vérifié en premier et **sans réseau**, pour qu'une panne du hub ne puisse pas enfermer
  Marc dehors de sa propre app. Tout le monde d'autre passe par `aAccesHub`
  (`lib/accesHub.ts`), qui interroge la table `acces` du hub via `POST /api/acces` avec le
  `HUB_TOKEN` déjà en place — aucun nouveau secret.

  Conséquence pratique : **inviter quelqu'un se fait depuis `hubperso.com/administration`**,
  pas en éditant une variable Vercel dans chaque app. Ne jamais rajouter une allowlist
  locale « en attendant » : elle deviendrait une seconde source de vérité, et personne ne
  penserait à l'y retirer le jour de la révocation.
- **Le contrôle est REJOUÉ, pas fait une fois.** `signIn` ne tourne qu'à la connexion, et
  le cookie de session est partagé entre les sous-domaines de `hubperso.com` : sans plus,
  l'app accepterait une session fabriquée par une autre app du hub. Le callback `jwt`
  revérifie donc à **chaque lecture** et renvoie `null` sinon. C'est ce qui rend la
  révocation réelle — retirer un accès mord dans la minute, sans déconnexion.
- **Un refus ne se met JAMAIS en cache.** Le cache d'`aAccesHub` ne mémorise que les OUI,
  60 s. Mémoriser un NON ferait attendre une minute quelqu'un qu'on vient tout juste
  d'ajouter — précisément à l'instant où l'on vérifie que ça marche.

## 2. Conventions de code

- **TypeScript strict**, pas de `any` silencieux.
- **Erreurs honnêtes** : ne pas avaler une exception, ne pas ajouter un `try/catch` qui
  cache un vrai bug. Chaque mode d'échec se distingue des autres.
- **Fonctions pures d'un côté, I/O de l'autre.** Ce qui décide se teste sans base, sans
  réseau et sans horloge — la date et les lectures se passent en paramètre.
- **Nommage clair plutôt que commentaires verbeux** ; mais un commentaire qui explique
  POURQUOI (surtout un piège) vaut son poids.
- **Planchers de version, jamais redescendus** : documenter dans `package.json` (clé `//`)
  toute version minimale imposée par une faille — ex. `drizzle-orm ≥ 0.45.2`
  (GHSA-gpj5-g38j-94v9, injection SQL, HIGH) chez BatchChef.
- Ne pas imposer le dark mode : `prefers-color-scheme` décide.

## 3. Workflow git

- Branches `claude/<slug>` pour le travail automatisé, `feature/<slug>` pour Marc.
- Commits en français, préfixés (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **PR en draft** pour itérer.
- ❌ Jamais `--force` sur `main`. ❌ Jamais `--no-verify`.
- ⚠️ **`git fetch origin main` AVANT de committer.** Plusieurs sessions peuvent travailler
  en parallèle sur le même dépôt ; le 20/08/2026, deux d'entre elles ont produit la même
  correction de CI, mot pour mot, dans la même heure.

## 4. Commandes utiles

```bash
npm run dev        # serveur de développement
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run build      # build de production
```

## 5. Vérifications avant commit

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

*(`lint` = ESLint CLI : `next lint` est déprécié et retiré dans Next 16. Le bloc `ignores`
de `eslint.config.mjs` est indispensable — l'ESLint CLI n'ignore pas `node_modules`/`.next`
implicitement, contrairement à `next lint` : 4 122 faux positifs mesurés chez JobAI.)*

La **CI** (`.github/workflows/ci.yml`) rejoue ce gate et part avec le fork — c'est voulu :
les apps nées de ce template ont démarré sans aucune vérification automatisée, et l'une a
laissé vivre une injection SQL en production faute de quoi que ce soit qui se déclenche.
Un job `audit` **séparé** (`npm audit --omit=dev`, aussi en hebdomadaire) complète le gate :
un avis de sécurité paraît sans qu'une ligne n'ait changé, et mêlé au gate il peindrait un
dépôt sain en rouge sans rapport avec le code — c'est ainsi qu'une CI cesse d'être lue.

⚠️ **Borner les jobs CI** (`timeout-minutes`). Sans plafond, un job figé tourne SIX HEURES
avant d'échouer — vécu sur DriveAI le 19/08/2026, où l'installation d'un navigateur
Playwright s'est bloquée 2 h 15 pendant que la PR restait « en attente » sans rien de rouge.

## 6. Après un merge : vérifier le DÉPLOIEMENT, pas seulement la CI

**CI verte ne veut pas dire « en ligne ».** Ce sont deux systèmes indépendants : la CI juge
le code, Vercel construit et sert. Un merge peut passer le gate et ne jamais être déployé —
la branche reste verte, le site continue de servir l'ancien build, et rien n'est rouge nulle
part.

Vécu le 31/07/2026 : quatre projets Vercel ont cessé de créer des déploiements pendant ~3 h.
DriveAI et JobAI ont rattrapé au push suivant ; Hubperso et BatchChef n'en ont pas eu — leur
commit d'en-têtes de sécurité est resté **cinq jours** en attente sans que personne ne le
voie.

Donc, après un merge qui change ce qui est SERVI (en-têtes, `next.config.mjs`, middleware,
variables de build, routes) : vérifier qu'un déploiement de production a bien été créé et
qu'il est `READY`, puis **contrôler l'effet sur la réponse réelle** — un en-tête se lit dans
la réponse, il ne se déduit pas du fichier source.

Corollaire : un merge qui ne change QUE de la doc n'a pas de déploiement à vérifier. Le dire
plutôt que de laisser croire qu'on a vérifié.

## 7. Intégration hub

- **`dataAsOf` ≠ `generatedAt`.** `generatedAt` = quand tu as fabriqué la réponse (toujours
  « maintenant »). `dataAsOf` = quand la DONNÉE a été rafraîchie. Sans lui, le hub ne peut
  pas distinguer « à jour » de « figé depuis trois jours ».
- **Période des coûts** (`usage.cost.period`) : le hub ne fusionne **jamais** deux périodes
  différentes — il l'a fait, ça produisait un montant qui n'existait pas. Choisir `total`
  sauf raison explicite : c'est ce que publient FinanceAI, BatchChef, DriveAI et JobAI, donc
  les coûts s'agrègent entre eux. `mois` isolerait l'app dans une colonne à part.
- **`HUB_TOKEN` sert dans LES DEUX SENS.** Entrant : le hub le présente pour lire le summary.
  **Sortant** : l'app le présente au hub sur `POST /api/acces`. C'est lui qui IDENTIFIE l'app
  côté hub, donc aucun `appId` n'est envoyé dans le corps — sinon une app pourrait interroger
  les accès d'une autre.
- **Un champ additif optionnel ne casse rien.** Les schémas strippent les clés inconnues :
  un producteur peut publier `usage` avant que tous les consommateurs ne soient re-pinnés.
- **Le hub ne connaît aucune app en particulier.** Il rend ce que le summary contient. Si tu
  veux quelque chose de spécifique à l'écran, ça passe par le contrat, pas par du code hub.

## 8. Documentation (où vit quoi)

| Fichier | Contenu |
|---|---|
| `README.md` | À quoi sert l'app, pour un lecteur extérieur. |
| `CLAUDE.md` | Ce fichier. Se charge à **chaque session** → il reste **court**. |
| `HANDOVER.md` | L'état RÉEL : ce qui tourne, ce qui reste à poser. À lire en premier. |
| `BACKLOG.md` | Ce qui est décidé mais pas fait. |
| `docs/adr/` | Décisions architecturales, `NNNN-slug.md`. |
| `docs/*.md` | Documents thématiques. Les leçons détaillées vont ici, jamais dans `CLAUDE.md`. |

⚠️ **Leçon FinanceAI** : son `CLAUDE.md` avait atteint 1 777 lignes (~36 500 tokens par
session) tout en affirmant être « dense et court ».

⚠️ **Doc périmée = pire que pas de doc.** Le README de JobAI a annoncé « rien n'est déployé »
pendant des semaines alors que l'app tournait avec des données réelles — et promettait en
même temps une fonctionnalité IA qui n'existait pas. Mettre à jour la doc touchée dans la
MÊME PR que le code.

⚠️ **Un chiffre au présent rote.** « 813 tests », « frein à 110 $ », « la campagne est
finie » : personne ne les relit et rien ne signale qu'ils sont devenus faux. Soit on les
date, soit on renvoie à la source qui fait foi.

## 9. Leçons apprises

**1. `/hub/summary` doit rester HORS du middleware d'auth utilisateur.**
Il porte sa propre auth (le jeton). S'il tombe sous le garde de session, le hub reçoit une
redirection HTML vers `/login` au lieu du JSON → widget « injoignable » en permanence.
Le symptôme est trompeur : l'app marche parfaitement dans ton navigateur (tu es connecté),
seul le hub voit le problème. Vécu par JobAI, qui l'a appelé « le défaut n°1 du squelette ».
Verrouillé par `tests/auth.test.ts` — ne pas supprimer ce test.

**2. Le hub polle toutes les ~15 s, et il ne peut pas deviner ce que ça te coûte.**
Si produire ton summary consomme une ressource BORNÉE (exécution Apps Script, appel d'API
tierce, requête lourde), mets un **cache court dans ton handler**. DriveAI a découvert que
19 polls sur 20 renvoyaient des octets identiques, chacun facturé sur un quota dur de
90 min/jour partagé avec son moteur. Règle : si la donnée ne bouge qu'aux N minutes, un
cache de ~N/5 ne perd aucune fraîcheur. ⚠️ Ne JAMAIS mettre une **panne** en cache — un
échec doit rester observable et le prochain appel doit réessayer.

**3. Un `undefined` dans une addition empoisonne TOUT le cumul.** `undefined + nombre` donne
`NaN`, et un seul suffit à rendre faux un total entier, pas seulement la valeur concernée.
Normaliser les champs absents à `0` à l'ENTRÉE. Vécu par DriveAI sur un JSON antérieur à un
changement de format.

**4. Une donnée illisible se COMPTE, elle ne se rabat pas sur zéro.** Un cumul discrètement
amputé est pire qu'une erreur visible : il se présente comme une mesure.

## 10. Style et compte-rendu

> 📣 Forme des comptes-rendus, des commits, des PR et des docs générées :
> [convention commune aux neuf dépôts](https://github.com/MoKarade/claude-config/blob/main/conventions/COMPTE-RENDU.md).
> Elle régit **la forme** ; ce fichier garde **le contenu métier**. Sur la forme, c'est la
> convention qui gagne ; sur le métier, c'est ce fichier.

@docs/COMPTE-RENDU.md

⚠️ **Pourquoi une COPIE et pas seulement un lien.** Un `CLAUDE.md` ne charge rien hors de son
propre arbre : le lien ci-dessus est lisible par un humain, il n'arrive jamais dans la session.
C'est exactement le mode de panne du 20/08/2026 — les règles de cadrage écrites dans un
`~/.claude/CLAUDE.md` local ne descendaient nulle part, et Marc constatait « je ne vois pas la
différence » alors que rien n'était jamais arrivé. `docs/COMPTE-RENDU.md` est donc une copie
**synchronisée**, importée ci-dessus, et la CI échoue si elle a dérivé de la source.

Pour changer la convention : la changer dans `claude-config`, propager les huit copies, mettre
à jour les huit empreintes. La friction est le garde-fou — une copie qu'on peut modifier sur
place redevient huit conventions différentes en trois mois.

## 11. Au fork — checklist

1. Personnaliser `APP` (id/name/url/color) dans `app/hub/summary/route.ts`. L'`id` doit
   correspondre EXACTEMENT à l'entrée de `lib/sources.ts` côté Hubperso.
2. Configurer l'environnement (cf. `.env.example`) : `HUB_TOKEN`, `AUTH_SECRET`,
   `AUTHORIZED_EMAIL`, `GOOGLE_CLIENT_ID/SECRET`, et en **production seulement**
   `AUTH_COOKIE_DOMAIN=.hubperso.com`.
   ⚠️ `AUTH_SECRET` doit être **identique** à celui du hub, sinon l'app reçoit le cookie
   partagé sans pouvoir le déchiffrer — et la connexion boucle sans message d'erreur.
3. Déclarer l'app dans `lib/sources.ts` du hub + la variable `HUB_TOKEN_<ID>`.
   ⚠️ C'est du **code** côté hub → ça exige un redéploiement du hub, pas juste une variable.
   Cette entrée fait DEUX choses : elle affiche le widget, **et** elle rend l'app
   attribuable dans `hubperso.com/administration`. Sans elle, personne ne peut recevoir
   l'accès — et ça ressemble à un bug d'autorisation.
4. Remplacer `buildingSummary(...)` par un vrai summary quand le moteur produit des données.
5. **Si l'app a une base** : ajouter `"vercel-build": "npm run db:migrate && next build"`
   (Vercel l'utilise à la place de `build` quand il existe) OU appliquer les migrations au
   démarrage. Exigence de Marc : **ne jamais avoir à lancer une commande sur son PC**.
6. Créer `HANDOVER.md` et `BACKLOG.md` dès la première session, et `docs/adr/` à la première
   décision architecturale.
