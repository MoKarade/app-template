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
- **App privée par défaut.** Elle affiche des données personnelles → session du hub
  (`providers: []`) + middleware fail-closed. Toute NOUVELLE route qui affiche des données
  reste DERRIÈRE le middleware.
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
- **Pas de fournisseur ici : l'app LIT la session du hub.** `auth.ts` a `providers: []`
  (modèle : CarAI, MemoryAI). Le cookie est posé par `hubperso.com` ; l'app le déchiffre
  (`AUTH_SECRET` identique) ou vérifie le cookie signé du hub avec ses clés publiques
  (`@mokarade/hub-contract/session`, `lib/sessionAsymetrique.ts`, `HUB_SESSION_PUBLIC_KEYS`).
  Elle ne peut pas fabriquer de session, et `/login` renvoie au hub au lieu d'ouvrir une
  porte. En local, aucune connexion n'est donc possible depuis l'app seule.
- **Le contrôle est REJOUÉ, pas fait une fois.** Il n'y a plus de callback `signIn`
  (aucune connexion ne se fait ici). Le cookie de session étant partagé entre les
  sous-domaines de `hubperso.com`, l'app accepterait sans plus une session fabriquée par une
  autre app du hub : le callback `jwt` revérifie donc à **chaque lecture** et renvoie `null`
  sinon, et toute page ou Server Action appelle `requireSession()` (`lib/session.ts`).
  Les deux passent par `decideAcces` (`lib/decisionAcces.ts`), qui écrit une fois l'ordre des
  deux étages. C'est ce qui rend la révocation réelle — retirer un accès mord dans la
  minute, sans déconnexion.
- **Un refus ne se met JAMAIS en cache.** Le cache d'`aAccesHub` ne mémorise que les OUI,
  60 s. Mémoriser un NON ferait attendre une minute quelqu'un qu'on vient tout juste
  d'ajouter — précisément à l'instant où l'on vérifie que ça marche.
