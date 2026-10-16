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
