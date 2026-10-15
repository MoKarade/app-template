// lib/decisionAcces.ts — « cette adresse a-t-elle le droit d'entrer ? », écrit UNE fois.
//
// DEUX ÉTAGES (ADR 0001 du hub) : le propriétaire d'abord, SANS réseau ; tout le monde
// d'autre ensuite, par le hub. Deux endroits en ont besoin — le callback `jwt` d'`auth.ts`
// (cookie Auth.js) et `requireSession` (cookie signé par le hub) : ils appellent tous deux
// cette fonction plutôt que de recopier l'ordre des étages, qui est la seule chose à ne
// jamais inverser (un hub en panne ne doit pas enfermer le propriétaire dehors).
//
// Fonction sans import de next-auth : `auth.ts` tire `next/server`, dont la résolution casse
// sous Vitest — une décision isolée ici se teste sans rien mocker (même patron que
// `decideGuard`).

import { isAuthorizedEmail } from "@/lib/authorized";

/**
 * true si `email` est le propriétaire, ou si le hub l'admet. Le hub n'est PAS interrogé
 * pour le propriétaire. Toute adresse absente ou vide est refusée, sans appel réseau.
 *
 * `interroger` est injecté (`aAccesHub` en production) : cette fonction ne touche ni
 * l'environnement ni le réseau.
 */
export async function decideAcces(
  email: string | null | undefined,
  proprietaire: string | undefined,
  interroger: (email: string) => Promise<boolean>,
): Promise<boolean> {
  if (!email?.trim()) return false;
  if (isAuthorizedEmail(email, proprietaire)) return true;
  return interroger(email);
}
