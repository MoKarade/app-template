# 13. LIA dans l'app

LIA, l'assistant de Marc, vit chez **MemoryAI** (cerveau, mémoire, outils). Chaque app ne fait que
l'afficher et lui relayer les questions **par le hub**, seul détenteur des jetons (MemoryAI ne détient aucun jeton d'app). Le corps (traits en canvas, vie propre, chat au clic,
menu au clic droit) vient du paquet `@mokarade/lia-ui`, épinglé **par tag** (`github:MoKarade/lia-ui#v0.38.0`),
jamais par branche, jamais publié sur npm. Mise à jour = changer le tag, comme `hub-contract`.

## Chemin d'une question

```
navigateur ──POST /api/lia/ask──▶ app ──POST /api/lia/ask (x-hub-token)──▶ hub ──▶ MemoryAI
 (cookie de session)            (requireSession)   (HUB_TOKEN de l'app)
```

| Pièce | Rôle |
|---|---|
| `lib/lia/contrat.ts` | Schémas Zod de la demande et de la réponse (pur) |
| `lib/lia/demander.ts` | Appel serveur vers le hub : https, jeton en en-tête, délai 35 s, échec fermé |
| `app/api/lia/ask/route.ts` | Route derrière le proxy ET `requireSession()` ; corps ≤ 8 Ko ; 401 / 400 / 413 / 503 |
| `lib/lia/client.ts` | Le `ask` du navigateur : parle à la route de l'app, jamais au hub |
| `lib/lia/monter.ts` + `components/LiaMontee.tsx` | Le layout racine rend TOUJOURS `LiaMontee`, avec `session={true}` pour une session admise ; le composant ne dessine rien, son module appelle `demarrerLia` (voir ci-dessous) |
| `lib/lia/askInvite.ts` | Mode invité : sans session, `ask` rejette avant tout réseau (fonctions pures, `tests/lia.askInvite.test.ts`) |

## Règles

- **`HUB_TOKEN` identifie l'app chez le hub** (comme pour `/api/acces`) : aucun identifiant d'app dans le corps. Il ne sort jamais du serveur.
- **`proprietaire`** : l'app envoie au hub `proprietaire: true` seulement si l'email de session égale `AUTHORIZED_EMAIL` (`estProprietaire`). Une app a des invités, MemoryAI jamais : sans ce champ MemoryAI répond 403, donc un invité n'interroge pas la mémoire de Marc.
- **Échec fermé** : sans `HUB_TOKEN`, hub ou MemoryAI en panne, trop lents ou non conformes → 503, et LIA dit « indisponible ». Jamais de réponse inventée.
- **Texte reçu du hub = donnée** : validé par Zod, affiché par `textContent` (jamais `innerHTML`).
- **v1 : texte, puces et humeur seulement.** Les blocs composés (`blocks`) sont strippés ; l'app n'a pas de rendu pour eux.
- **Pas d'actions** dans le menu du clic droit en v1 : LIA propose, le hub exécute (catalogue : `hub-contract#78`).
- **Le mouvement et la pastille d'humeur sont ceux du paquet** (même LIA que le hub) : `quandMouvementReduit` vaut « complet » par défaut depuis lia-ui v0.10.0 et `humeurVisible` est vrai par défaut depuis v0.11.0 ; `LiaMontee` ne les passe pas, aucune pastille maison (verrou `tests/liaMontee.test.ts`, paquet ≥ v0.28.0).
- **LIA est démarrée par `demarrerLia`, pas par `<Lia />`** (lia-ui v0.16.0, « présente tout le temps ») : `demarrerLia` de `@mokarade/lia-ui/boot` s'appelle au CHARGEMENT du module `components/LiaMontee.tsx` (client, gardé par `typeof window`), jamais dans un effet ni dans le corps d'un composant. LIA se pose alors dans `document.body` avant l'hydratation et reste là pendant `loading.tsx`, `error.tsx`, `not-found.tsx` et `global-error.tsx`. Verrou : `tests/liaMontee.test.ts` (appel au niveau du module, aucun `<Lia`).
- **Mode invité (24/10/2026, Marc : « LIA présente tout le temps »)** : LIA est montée sur toutes les pages, `/login` et `app/global-error.tsx` compris. Sans session admise (`session` faux, ou inconnue dans `global-error`) elle bouge, a une humeur et parle avec ses propres phrases, mais `ask` est refusé AVANT tout réseau (`creerAskInvite`) : elle dit « indisponible », la route `/api/lia/ask` reste derrière la session. Aucun état partagé : le squelette n'a pas de route `etat`, son état reste local. Le drapeau de session ne fait que monter, levé dans un effet. Routes sans LIA : celles qui ne rendent aucune page (`/hub/summary`, `/api/auth/*`, `/api/lia/ask`). Un fork qui ajoute une page publique l'a donc aussi, en mode invité.
- **Une seule LIA par page** : ne jamais monter `<Lia>` ailleurs que dans le layout.
- L'URL est `NEXT_PUBLIC_HUB_URL` (déjà utilisée par `accesHub.ts`, défaut `https://hubperso.com`) ; `http:` est refusé.
- ⚠️ Un fork avec une **CSP** doit autoriser les styles que le paquet injecte (`style-src`), sinon LIA s'affiche sans habillage.
