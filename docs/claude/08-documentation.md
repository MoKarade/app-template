## 8. Documentation (où vit quoi)

| Fichier | Contenu |
|---|---|
| `README.md` | À quoi sert l'app, pour un lecteur extérieur. |
| `CLAUDE.md` | Fichier racine, court, qui renvoie à ce dossier. Se charge à **chaque session** → il reste **court**. |
| `HANDOVER.md` | L'état RÉEL : ce qui tourne, ce qui reste à poser. À lire en premier. |
| `BACKLOG.md` | Un renvoi vers les issues du dépôt, où vit ce qui est décidé mais pas fait (20 lignes au plus). |
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
