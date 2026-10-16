## 3. Workflow git

- Branches `claude/<slug>` pour le travail automatisé, `feature/<slug>` pour Marc.
- Commits en français, préfixés (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **PR en draft** pour itérer.
- **Fusion** (depuis le 15/10/2026, #29) : Mergify, réglé dans `.mergify.yml`. Une PR hors
  brouillon, sans l'étiquette `hold`, dont Gate, Qualité et Sécurité sont verts est fusionnée
  en squash. Une PR qui touche `.github/`, `scripts/hooks/`, `qualite/`, `vercel.json`,
  `drizzle/` ou `.env*` est fusionnée aussi quand le contrôle « Garde-fou » est vert (oui de Marc, 15/10/2026) ; rouge (test retiré ou sauté, seuil baissé, secret, migration destructive, `.mergify.yml` ou garde-fou modifié), elle attend Marc (issue `qui:marc`).
- ❌ Jamais `--force` sur `main`. ❌ Jamais `--no-verify`.
- **Préversions Vercel coupées** (`vercel.json`, tâche #41) : seule `main` se déploie, les
  autres branches n'ouvrent aucun déploiement (quota partagé entre les apps). Un fork garde la
  règle ; ne pas la retirer « pour voir une préversion ». Verrouillé par `tests/vercel.test.ts`.
- ⚠️ **`git fetch origin main` AVANT de committer.** Plusieurs sessions peuvent travailler
  en parallèle sur le même dépôt ; le 20/08/2026, deux d'entre elles ont produit la même
  correction de CI, mot pour mot, dans la même heure.
