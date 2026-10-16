// app/hub/summary/route.ts
//
// Endpoint consommé par le hub perso (hubperso.com), contrat @mokarade/hub-contract.
//
// LA MÉCANIQUE N'EST PLUS ICI. Le trio 503/401/405, la comparaison du jeton en temps
// constant, `Cache-Control: no-store` et la validation avant émission vivent dans
// `serveSummary` (`@mokarade/hub-contract/endpoint`), écrits UNE fois pour toutes les apps.
// Ce fichier ne garde que ce qui t'est propre : QUI tu es, et QUOI publier.
//
// Pourquoi ça compte pour un template en particulier : un template se FORKE. Tant que la
// mécanique était recopiée ici, chaque fork en emportait une copie, et un correctif de
// sécurité dans le squelette n'atteignait jamais les apps déjà forkées. Un `npm update` les
// atteint. C'est le même défaut que « la même règle dans quatre fichiers, trois états de
// vérité », mais dans du code d'authentification.
//
// ⚠️ Cette route reste HORS du proxy d'authentification utilisateur : elle porte sa
// propre auth par jeton. Voir l'en-tête de `lib/authGuard.ts` — c'est le piège n°1 de ce
// template, vécu en production.
//
// ── CE QUE LE HUB FAIT DE TA RÉPONSE, ET CE QUE ÇA T'IMPOSE ──────────────────────────
//
// 1. IL POLLE VITE. Le hub rafraîchit toutes les ~15 s tant qu'un onglet est ouvert.
//    Si produire ton summary coûte quelque chose de BORNÉ (exécution Apps Script, appel
//    d'API tierce, requête lourde), METS UN CACHE COURT dans ton `build` — pas dans le hub,
//    il ne peut pas savoir ce que ça te coûte. DriveAI a découvert que 19 polls sur 20
//    renvoyaient des octets identiques, chacun au prix d'une exécution comptée sur un quota
//    DUR. Règle : si la donnée sous-jacente ne bouge qu'aux N minutes, un cache de N/5 ne
//    perd aucune fraîcheur et divise la facture d'autant. Ne JAMAIS mettre en cache une
//    PANNE — un échec doit rester observable et le prochain appel doit réessayer.
//
// 2. IL AFFICHE `dataAsOf`, PAS `generatedAt`. `generatedAt` = quand tu as fabriqué la
//    réponse (toujours « maintenant »). `dataAsOf` = quand la DONNÉE a été rafraîchie pour
//    la dernière fois. Si ton moteur tourne par tick, publie `dataAsOf` : sans lui, le hub
//    ne peut pas distinguer « à jour » de « figé depuis trois jours ».
//
// 3. IL SOMME LES COÛTS PAR PÉRIODE. Le bloc `usage` porte `cost: { amount, currency,
//    period }` avec period = 'total' | 'mois' | 'jour'.
//    ⚠️ Le hub ne fusionne JAMAIS deux périodes différentes (il l'a fait, ça produisait un
//    montant qui n'existe pas). Choisis `total` (cumul depuis toujours) sauf raison
//    explicite : c'est ce que publient BatchChef, FinanceAI et DriveAI, donc leurs coûts
//    s'agrègent entre eux. Une app qui publie `mois` apparaîtra dans un total séparé.
//    Si tu n'as AUCUN coût réel à publier, n'envoie PAS de bloc `usage` : l'app s'affiche
//    « non suivie », ce qui est honnête. Un `amount: 0` inventé serait de la fausse donnée.
//
// 4. IL REND TES `href` VIA UN FILTRE. Seuls http/https deviennent cliquables. Publie des
//    URLs absolues. Une action `kind: "trigger"` est jugée bien plus sévèrement — le hub la
//    refuse si elle n'est pas sur TON origine, puisqu'il POSTe dessus avec ton jeton.

import { buildingSummary, type HubSummary } from "@mokarade/hub-contract";
import { HUB_TOKEN_HEADER, serveSummary } from "@mokarade/hub-contract/endpoint";

// ── À PERSONNALISER AU FORK ──────────────────────────────────────────────────
const APP: HubSummary["app"] = {
  id: "app-template", // kebab-case, stable, DOIT égaler l'id déclaré dans le lib/sources.ts du hub
  name: "App Template", // 1 à 30 caractères
  url: "https://app-template.hubperso.com",
  color: "#6366f1", // hex 6 digits, couleur d'accent du widget
};

/**
 * TODO AU FORK : remplacer par un vrai summary quand ton moteur est actif.
 *
 * Si cette fonction JETTE, `serveSummary` répond 500 — jamais un summary partiel. C'est
 * voulu : le hub sait afficher « injoignable », il ne sait pas deviner qu'un chiffre manque.
 */
function construireSummary(): HubSummary {
  return buildingSummary(APP, {
    alertLabel: "App en construction — moteur pas encore actif.",
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// Jamais de cache statique : le hub veut l'état courant à chaque appel.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { status, headers, body } = await serveSummary(
    { method: "GET", token: request.headers.get(HUB_TOKEN_HEADER) },
    { expectedToken: process.env.HUB_TOKEN, build: construireSummary },
  );
  return new Response(body, { status, headers });
}
