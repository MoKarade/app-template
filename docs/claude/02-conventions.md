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
- **Socle visuel** (`app/globals.css`, tâche #39) : couleurs en variables, clair et sombre, et
  nulle part ailleurs — ni valeur de couleur ni classe de palette dans `app/`, `components/`,
  `lib/`. Vocabulaire `.carte` `.bouton` `.champ` `.doux` `.succes` `.alerte` `.erreur`. Cibles
  ≥ 44 px, champs à 16 px. ⚠️ Une couleur figée est lisible dans le thème où on l'a écrite :
  BatchChef a eu 21 « blanc sur blanc » sans une erreur. Verrouillé par `tests/theme.test.ts`.
