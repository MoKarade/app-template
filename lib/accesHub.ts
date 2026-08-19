// lib/accesHub.ts — « cette personne a-t-elle le droit d'entrer ICI ? », posée au hub.
//
// ── POURQUOI CE MODULE EXISTE ────────────────────────────────────────────────────────
//
// Avant l'ADR 0001 du hub, la liste des personnes admises était une variable
// d'environnement par app (`AUTHORIZED_EMAIL`), donc une adresse unique. Inviter
// quelqu'un voulait dire éditer une variable Vercel dans chaque app, la redéployer, et
// espérer n'en avoir oublié aucune.
//
// Depuis, cette liste vit dans la base du hub (table `acces`, une ligne par personne ET
// par app) et se gère depuis `hubperso.com/administration`. Ce module pose la question :
//
//   POST https://hubperso.com/api/acces   { "email": "…" }   → { "acces": true|false }
//
// authentifié par `HUB_TOKEN` — le MÊME secret que l'app utilise déjà pour publier son
// résumé sur `/hub/summary`. Aucun nouveau secret à gérer. C'est le jeton qui identifie
// l'app appelante côté hub : l'`appId` n'est jamais envoyé dans le corps, sinon une app
// pourrait interroger les accès d'une autre.
//
// ── CACHE D'UNE MINUTE, POSITIFS SEULEMENT ───────────────────────────────────────────
//
// Sans cache, chaque lecture de session ferait un aller-retour réseau. Avec un cache plus
// long, retirer un accès mettrait trop de temps à mordre. Une minute est le compromis
// assumé, aligné sur celui du hub.
//
// UN REFUS N'EST JAMAIS MIS EN CACHE. Le mémoriser ferait attendre jusqu'à une minute
// quelqu'un qu'on vient tout juste d'ajouter dans l'administration — précisément à
// l'instant où l'on vérifie que ça marche, donc au pire moment possible.
//
// ── ÉCHEC FERMÉ ──────────────────────────────────────────────────────────────────────
//
// Hub injoignable, jeton absent, réponse inattendue : tout répond `false`. Mieux vaut
// refuser que laisser entrer sur un accroc réseau. Le corollaire est assumé : le hub
// devient un point de panne unique pour les invités — d'où l'échappatoire du
// PROPRIÉTAIRE dans `auth.ts`, vérifiée en premier et SANS réseau.

const URL_HUB = (process.env.NEXT_PUBLIC_HUB_URL?.trim() || "https://hubperso.com").replace(
  /\/+$/,
  "",
);

const HUB_TOKEN_HEADER = "x-hub-token";

/** Durée de vie d'une réponse POSITIVE mémorisée. */
export const CACHE_ACCES_MS = 60_000;

const cache = new Map<string, number>();

/** Pour les tests, et pour rendre le cache observable plutôt que magique. */
export function viderCacheAcces(): void {
  cache.clear();
}

function normaliser(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** La seule partie qui touche le réseau — extraite pour être remplaçable en test. */
async function demanderAuHub(adresse: string, jeton: string): Promise<boolean> {
  const reponse = await fetch(new URL("/api/acces", URL_HUB), {
    method: "POST",
    headers: { "content-type": "application/json", [HUB_TOKEN_HEADER]: jeton },
    body: JSON.stringify({ email: adresse }),
    cache: "no-store",
  });
  if (!reponse.ok) return false;
  const corps: unknown = await reponse.json();
  return (
    typeof corps === "object" &&
    corps !== null &&
    "acces" in corps &&
    (corps as { acces: unknown }).acces === true
  );
}

/**
 * Cette adresse a-t-elle accès à CETTE app, d'après le hub ?
 *
 * `env`, `maintenantMs` et `interroger` sont injectables : ni variable d'environnement
 * réelle, ni horloge réelle, ni requête réseau réelle à fournir pour éprouver le cache
 * et l'échec fermé.
 */
export async function aAccesHub(
  email: string | null | undefined,
  env: Partial<NodeJS.ProcessEnv> = process.env,
  maintenantMs: number = Date.now(),
  interroger: (adresse: string, jeton: string) => Promise<boolean> = demanderAuHub,
): Promise<boolean> {
  const adresse = normaliser(email);
  if (!adresse) return false;

  const expiration = cache.get(adresse);
  if (expiration !== undefined && expiration > maintenantMs) return true;

  const jeton = env.HUB_TOKEN?.trim();
  if (!jeton) return false;

  try {
    const accorde = await interroger(adresse, jeton);
    if (!accorde) {
      cache.delete(adresse);
      return false;
    }
    cache.set(adresse, maintenantMs + CACHE_ACCES_MS);
    return true;
  } catch (erreur) {
    console.error("[accesHub] requête au hub impossible :", erreur);
    return false;
  }
}
