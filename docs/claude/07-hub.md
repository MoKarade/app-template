## 7. Intégration hub

- **`dataAsOf` ≠ `generatedAt`.** `generatedAt` = quand tu as fabriqué la réponse (toujours
  « maintenant »). `dataAsOf` = quand la DONNÉE a été rafraîchie. Sans lui, le hub ne peut
  pas distinguer « à jour » de « figé depuis trois jours ».
- **Période des coûts** (`usage.cost.period`) : le hub ne fusionne **jamais** deux périodes
  différentes — il l'a fait, ça produisait un montant qui n'existait pas. Choisir `total`
  sauf raison explicite : c'est ce que publient FinanceAI, BatchChef, DriveAI et JobAI, donc
  les coûts s'agrègent entre eux. `mois` isolerait l'app dans une colonne à part.
- **`HUB_TOKEN` sert dans LES DEUX SENS.** Entrant : le hub le présente pour lire le summary.
  **Sortant** : l'app le présente au hub sur `POST /api/acces`. C'est lui qui IDENTIFIE l'app
  côté hub, donc aucun `appId` n'est envoyé dans le corps — sinon une app pourrait interroger
  les accès d'une autre.
- **Un champ additif optionnel ne casse rien.** Les schémas strippent les clés inconnues :
  un producteur peut publier `usage` avant que tous les consommateurs ne soient re-pinnés.
- **Le hub ne connaît aucune app en particulier.** Il rend ce que le summary contient. Si tu
  veux quelque chose de spécifique à l'écran, ça passe par le contrat, pas par du code hub.
