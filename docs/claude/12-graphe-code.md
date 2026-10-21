# 12 — Graphe de code local (graphifyy), à la demande

**Statut : essai (21/10/2026), tâche MoKarade/.github#323.** Outil optionnel pour répondre à « qui appelle quoi » sans relire des fichiers. Rien n'est branché dans Claude Code : pas de hook, pas de serveur MCP, pas de ligne ajoutée à `CLAUDE.md`.

## Commande
`scripts/graphe.sh update` (3 à 10 s) puis `scripts/graphe.sh affected "requireSession()"` · `query "<question>"` · `path "A" "B"` · `explain "<symbole>"` · `god-nodes`.
Le script installe `graphifyy[sql]==0.9.93` (version épinglée) dans un venv de `~/.cache`, coupe tout backend LLM (`GRAPHIFY_BACKEND=none`) et écrit dans `graphify-out/` (ignoré par git).

## Règles (chacune vient d'un constat, labels de confiance en face)
- **0 jeton, 0 clé** : `update` est local (Tree-sitter), sans appel réseau ni LLM ; le paquet ne contacte le réseau que pour `add`, `clone` et les commandes LLM (`extract`, `label`, `cluster-only`). [Certain, code lu et `strace` : aucun `connect`]
- **Jamais `label` ni `cluster-only` sans `GRAPHIFY_BACKEND=none`** : sans clé API, ils se replient sur `claude -p` et consomment le quota Claude. [Certain]
- **Jamais `graphify claude install`, `graphify hook install` ni la skill `/graphify`** : le premier réécrit `CLAUDE.md` (verrou ≤ 60 lignes de `tests/claudeMd.test.ts`) et `.claude/settings.json` (chemin protégé) ; la skill lance `pip install` et des sous-agents LLM. [Certain]
- **`graphify-out/` n'est jamais committé** : les commentaires `TODO:`, `NOTE:`, `FIXME:` et les docstrings y sont copiés (80 caractères, e-mails compris), et `graph.html` charge `vis-network` depuis unpkg. Dépôt public : aucune donnée perso dans un commentaire de code. [Certain]
- **Toujours depuis la racine** (`scripts/graphe.sh` s'en charge) : `graphify update /chemin/absolu` écrit ce chemin dans `.graphify_root`. [Certain]
- **Version épinglée** : le paquet sort presque une version par jour ; monter la version = relancer la mesure ci-dessous. Extra `[sql]` obligatoire : sans lui, les migrations `.sql` donnent 0 nœud. [Certain]

## Ce que ça apporte, ce que ça n'apporte pas (mesure BatchChef, 21/10/2026, 290 fichiers)
- Le « 61,6x » de `graphify benchmark` compare à la lecture de TOUT le dépôt, ce que personne ne fait. Contre `grep` + lecture du fichier utile, sur 4 questions à symbole connu : 12,3 k jetons (grep + lecture) contre 12,0 k (requête + extrait), soit aucun gain net ; la requête ramène des nœuds génériques (`react`, `vitest`, `package.json`). [Certain pour ces 4 questions, n = 4]
- Ce que `grep` ne donne pas : `affected "X"` rend en une commande les importeurs transitifs ET les documents qui citent X, avec fichier:ligne (« qui casse si je change X »). [Certain]
- Les chiffres du document source (71,5x, -80 %, 76 % LongMemEval) viennent du fournisseur, sur d'autres corpus ; ils ne valent pas pour du TypeScript. [Probable]

Extension aux autres dépôts : seulement si 10 questions réelles montrent au moins 30 % de jetons en moins que `grep` + `Read` (voir commun/plans/2026-10-21_graphify-analyse.md).
