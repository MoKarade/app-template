# BACKLOG — app-template

Ce qui est décidé mais pas fait. Un item peut être **périmé** (réglé ailleurs) : vérifier
l'état réel avant de coder.

## À faire

- **[T-01] Renommer la branche par défaut en `main`.** Elle s'appelle aujourd'hui
  `claude/hopeful-lovelace-4d09zx`. Un template dont la référence porte un nom de session
  est fragile : tout fork et toute PR partent de là. GitHub → Settings → Branches.
  *Seul Marc peut le faire.*

- **[T-02] Un test qui verrouille la checklist de fork.** La § 11 du `CLAUDE.md` dit de
  déclarer l'app dans `lib/sources.ts` du hub. Rien ne vérifie qu'un fork l'a fait — et
  l'oubli ressemble à un bug d'autorisation, pas à une étape sautée. Piste : un test qui
  échoue tant que `APP.id` vaut encore la valeur d'exemple du template.

## Fait

- ~~Brancher l'autorisation par le hub~~ — 20/08/2026, PR #4. Le template produisait des
  apps qui ne participaient pas au modèle d'accès, sans que rien ne soit rouge.
- ~~Aligner la structure sur la convention commune~~ — 20/08/2026.
