// lib/sessionAsymetrique.ts — lecture de la session signée par le hub.
//
// Plan `auth-asym-hubperso`, Option A : Hubperso est le SEUL à signer (clé privée dans son
// seul projet Vercel). Les apps ne font que LIRE, avec les clés publiques : ce module
// n'importe aucune fonction de signature et ne reçoit jamais de clé privée. Une app née de
// ce template ne peut donc pas fabriquer de session, par construction.
//
// Additif : tant que le hub n'émet pas ce cookie, `lib/session.ts` retombe sur celui
// d'Auth.js. `AUTH_SECRET` et next-auth restent en place.
//
// Clés publiques : JAMAIS inventées. `HUB_SESSION_PUBLIC_KEYS` porte le JWKS publié par le
// hub (1 à 2 `kid` pendant une rotation), en JSON. Absente ou illisible → aucune session
// signée n'est acceptée, jamais d'exception.

import { verifierSession, type IdentiteSession } from "@mokarade/hub-contract/session";

/** Nom du cookie signé posé par Hubperso, domaine `.hubperso.com`. */
export const NOM_COOKIE_SESSION_HUB = "__Secure-hub.session";

function clesPubliques(env: Partial<NodeJS.ProcessEnv>): unknown {
  const brut = env.HUB_SESSION_PUBLIC_KEYS?.trim();
  if (!brut) return null;
  try {
    return JSON.parse(brut);
  } catch {
    return null;
  }
}

/**
 * Vérifie le cookie signé et rend l'identité, ou `null` si quoi que ce soit ne va pas
 * (cookie absent, clés non configurées, signature fausse, algorithme autre qu'ES256, `kid`
 * inconnu, expiré…). Ne lève jamais : `verifierSession` du contrat porte cette garantie,
 * testée là-bas ; ce module ajoute la lecture de la variable d'environnement.
 */
export async function lireSessionHub(
  cookieValue: string | undefined,
  env: Partial<NodeJS.ProcessEnv> = process.env,
  maintenant?: Date,
): Promise<IdentiteSession | null> {
  if (!cookieValue) return null;
  const cles = clesPubliques(env);
  if (!cles) return null;
  return verifierSession(cookieValue, cles, maintenant ? { maintenant } : {});
}
