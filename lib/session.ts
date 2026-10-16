// lib/session.ts — revérification de session côté serveur (défense en profondeur).
//
// Le proxy garde déjà tout ce qui n'est pas explicitement public. Revérifier ICI n'est
// pas redondant : une erreur de matcher — un caractère dans une expression régulière —
// suffirait à exposer une route sans que rien ne le signale. Deux gardes indépendantes, une
// seule à se tromper. Une Server Action est de plus un point d'entrée POST à part entière,
// atteignable sans la page qui affiche le bouton : elle appelle `requireSession()`, toujours.
//
// Deux sources d'identité, la même décision d'accès pour les deux (`decideAcces`) :
//   1. le cookie signé par le hub (`__Secure-hub.session`), vérifié avec les clés publiques ;
//   2. à défaut, la session Auth.js (cookie partagé chiffré par `AUTH_SECRET`).
// Une identité valide mais REFUSÉE par `decideAcces` n'ouvre pas la seconde porte : le refus
// est final, sinon un cookie d'une autre app du hub passerait par l'autre chemin.

import { auth } from "@/auth";
import { cookies } from "next/headers";
import { aAccesHub } from "@/lib/accesHub";
import { isAuthConfigured } from "@/lib/authConfigured";
import { decideAcces } from "@/lib/decisionAcces";
import { lireSessionHub, NOM_COOKIE_SESSION_HUB } from "@/lib/sessionAsymetrique";

export class NonAutorise extends Error {
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "NonAutorise";
  }
}

/**
 * Exige une session valide dont l'adresse est admise (propriétaire, ou accordée par le
 * hub). Lève sinon. Échec fermé : sans configuration d'auth complète, on refuse — Auth.js
 * seul se contente de logguer `MissingSecret` et LAISSE PASSER.
 */
export async function requireSession(): Promise<{ email: string }> {
  if (!isAuthConfigured()) {
    throw new NonAutorise("Authentification non configurée. Accès refusé.");
  }

  const proprietaire = process.env.AUTHORIZED_EMAIL;

  const magasin = await cookies();
  const signee = await lireSessionHub(magasin.get(NOM_COOKIE_SESSION_HUB)?.value);
  if (signee) {
    if (await decideAcces(signee.email, proprietaire, aAccesHub)) {
      return { email: signee.email };
    }
    throw new NonAutorise();
  }

  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email || !(await decideAcces(email, proprietaire, aAccesHub))) throw new NonAutorise();
  return { email };
}
