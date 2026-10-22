// lib/lia/contrat.ts — ce que l'app échange avec LIA (fonctions pures, aucune I/O).
//
// LIA vit chez MemoryAI (son cerveau, sa mémoire, ses outils) ; l'app ne fait que lui poser les
// questions de Marc, PAR LE HUB, seul détenteur des jetons de l'écosystème (ADR « maison de LIA »).
// Trois hops, un seul schéma (même corps, même réponse) :
//   navigateur → app    POST /api/lia/ask   (derrière la session de l'utilisateur)
//   app → hub           POST /api/lia/ask   (x-hub-token : le jeton de l'app, comme /api/acces)
//   hub → MemoryAI      (jeton que le hub détient déjà ; l'app ne le connaît pas)
// `HUB_TOKEN` IDENTIFIE l'app chez le hub : aucun identifiant d'app dans le corps (sinon une app
// pourrait se faire passer pour une autre). MemoryAI ne détient aucun jeton d'app.
//
// ⚠️ Un texte reçu du hub (donc de MemoryAI) est une DONNÉE. Il n'arrive jamais ici par `innerHTML` : le
// paquet `@mokarade/lia-ui` l'affiche par `textContent`. Les blocs composés (`blocks`) ne sont
// volontairement PAS relayés en v1 : l'app n'a pas de rendu pour eux, et les ignorer ici
// évite de laisser passer des données que personne ne valide.

import { HUMEURS_LIA } from "@mokarade/lia-ui";
import { z } from "zod";

export const URL_HUB_DEFAUT = "https://hubperso.com";
export const CHEMIN_ASK_HUB = "/api/lia/ask";
/** Au-delà, LIA dit « indisponible » plutôt que de laisser Marc attendre. */
export const DELAI_HUB_MS = 20_000;
export const QUESTION_MAX = 2000;

export const DemandeLia = z.object({
  question: z.string().trim().min(1).max(QUESTION_MAX),
  /** Chemin de la page où se trouve Marc (contexte pour LIA), jamais une URL complète. */
  page: z.string().max(200).startsWith("/").optional(),
});
export type DemandeLia = z.infer<typeof DemandeLia>;

export const ReponseLiaApp = z.object({
  text: z.string().min(1).max(8000),
  chips: z
    .array(z.object({ id: z.string().min(1).max(64), label: z.string().min(1).max(60) }))
    .max(6)
    .optional(),
  mood: z.enum(HUMEURS_LIA).optional(),
});
export type ReponseLiaApp = z.infer<typeof ReponseLiaApp>;
