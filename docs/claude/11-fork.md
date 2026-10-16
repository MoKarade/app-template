## 11. Au fork — checklist

1. Personnaliser `APP` (id/name/url/color) dans `app/hub/summary/route.ts`. L'`id` doit
   correspondre EXACTEMENT à l'entrée de `lib/sources.ts` côté Hubperso.
   Verrouillé : `tests/forkIdentite.test.ts` rougit le gate tant que `APP.id` vaut `app-template`
   (le squelette en est exempté par l'identité de son dépôt, rien à retirer au fork).
2. Configurer l'environnement (cf. `.env.example`) : `HUB_TOKEN`, `AUTH_SECRET`,
   `AUTHORIZED_EMAIL`, et en **production seulement** `AUTH_COOKIE_DOMAIN=.hubperso.com`
   (+ `HUB_SESSION_PUBLIC_KEYS` quand le hub publie ses clés). **Plus de
   `GOOGLE_CLIENT_ID/SECRET`** : l'app ne parle pas à Google, elle lit la session du hub.
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
