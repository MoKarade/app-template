# Boîte du Réacteur : preuve PC

PR brouillon permanente, ne pas fusionner ni fermer (MoKarade/.github#808).
Le Réacteur y commente une ligne `RÉACTEUR : relevé PC demandé sur <dépôt>#<n>` (identifiants seulement, jamais le contenu de l'issue) quand le fil propriétaire d'une tâche en `preuve-attendue` demande un relevé d'écran de classe C par un commentaire `**Relevé PC demandé** — …`.
Le PC lit alors l'issue, fait le relevé dans Chrome et répond par `**Relevé PC** — lu le AAAA-MM-JJ HH:MM (Québec) : …` sur la même issue ; le Réacteur réveille ensuite la boîte du dépôt propriétaire.
Protocole : `docs/cycle-de-vie-tache.md` §10 quater de MoKarade/.github.
