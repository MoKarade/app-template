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
