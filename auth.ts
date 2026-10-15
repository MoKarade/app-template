// auth.ts
//
// Auth.js (NextAuth v5) SANS fournisseur. Cette app lit, elle n'émet pas.
//
// Depuis l'ADR 0001 de Hubperso, le hub est la porte d'entrée unique de l'écosystème : une
// app née de ce template ne parle pas à Google, elle déchiffre le cookie de session posé
// sur `.hubperso.com`. Pas de `GOOGLE_CLIENT_ID/SECRET` à poser, pas de redirect URI à
// déclarer côté Google Cloud.
//
// ── QUI A LE DROIT D'ENTRER : DEUX ÉTAGES, PAS UN SEUL (ADR 0001 du hub) ─────────────
//
// 1. `AUTHORIZED_EMAIL` = le PROPRIÉTAIRE. Vérifié en PREMIER et SANS réseau. Ce n'est
//    pas « la seule adresse admise » : c'est l'échappatoire qui garantit qu'une panne du
//    hub — ou une ligne supprimée par erreur — ne peut pas enfermer Marc dehors de sa
//    propre app.
// 2. Tout le monde d'autre : `aAccesHub` interroge la table `acces` du hub. C'est là, et
//    seulement là, que vit la liste. Inviter quelqu'un depuis `hubperso.com/administration`
//    doit suffire à lui ouvrir cette app, SANS toucher à `AUTHORIZED_EMAIL` ici ni
//    redéployer quoi que ce soit. L'ordre des deux étages est écrit une fois, dans
//    `lib/decisionAcces.ts`.
//
// ── LE CONTRÔLE EST REJOUÉ, PAS FAIT UNE FOIS ────────────────────────────────────────
//
// Il n'y a PLUS de callback `signIn` : aucune connexion ne se fait ici, il ne tournerait
// jamais — le garder donnerait l'illusion d'un contrôle. Tout repose sur le callback `jwt`,
// qui tourne à CHAQUE lecture de session et suit donc la donnée, pas la connexion. Sans lui,
// l'app accepterait sans broncher une session fabriquée par une AUTRE app du hub (le cookie
// est partagé entre les sous-domaines, voir `lib/sessionPartagee.ts`) : un accès accordé
// pour une seule app ne doit pas ouvrir les autres. C'est aussi ce qui rend la révocation
// réelle — retirer un accès mord dans la minute, sans déconnexion.
//
// Session en JWT : pas de base de données requise pour l'auth. Le secret vient de
// l'environnement, jamais du code (cf. `.env.example`).
//
// ── AU FORK ──────────────────────────────────────────────────────────────────────────
//
// Rien à changer dans ce fichier. Il reste à : (1) poser les variables d'environnement,
// (2) ajouter l'app dans `lib/sources.ts` du hub — c'est ce qui la fait apparaître dans
// /administration et rend son accès attribuable. Si l'app doit un jour se connecter SANS
// le hub, il faudra réintroduire un fournisseur ici ET un callback `signIn` : ce n'est pas
// le cas d'un fork ordinaire.

import NextAuth from "next-auth";
import { decideAcces } from "@/lib/decisionAcces";
import { aAccesHub } from "@/lib/accesHub";
import { cookiesSessionPartagee } from "@/lib/sessionPartagee";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ── AUCUN FOURNISSEUR, ET C'EST LE POINT ────────────────────────────────────────
  // Auth.js reste indispensable pour autant : c'est lui qui déchiffre le cookie et expose
  // `auth()` au garde. Les routes `/api/auth/*` continuent de servir la session et la
  // DÉCONNEXION — laquelle vaut pour toutes les apps, le cookie étant partagé.
  providers: [],
  session: { strategy: "jwt" },
  // ── CONNEXION UNIQUE ENTRE LES APPS DU HUB ─────────────────────────────────────────
  // Avec `AUTH_COOKIE_DOMAIN=.hubperso.com`, le cookie est déclaré sur le domaine parent :
  // le navigateur l'envoie à TOUS les sous-domaines. Combiné à un `AUTH_SECRET` IDENTIQUE
  // partout (le JWT est chiffré avec — sans le même secret, l'app reçoit le cookie mais
  // n'en tire rien), se connecter à une app vaut pour toutes. Corollaire assumé : une
  // déconnexion vaut aussi pour toutes.
  //
  // La variable n'est posée qu'en PRODUCTION : un cookie `Domain=.hubperso.com` est rejeté
  // sur localhost et sur `<projet>.vercel.app`, et il l'est SILENCIEUSEMENT — on retombe
  // sur /login en boucle, sans erreur nulle part.
  cookies: cookiesSessionPartagee(process.env.AUTH_COOKIE_DOMAIN),
  // Requis en local/self-hosted (sinon Auth.js lève UntrustedHost). Sans risque : il n'y a
  // plus de flux OAuth à détourner, l'app ne fait que déchiffrer.
  trustHost: true,
  // `/login` n'est pas une porte mais un couloir vers le hub. Le garde y envoie les
  // visiteurs sans session, et Auth.js y renvoie ses erreurs : la page s'arrête alors pour
  // les DIRE, au lieu de rediriger et de boucler.
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Renvoyer `null` INVALIDE la session (Auth.js v5) : le middleware redirige vers
    // /login, aucune donnée n'est rendue.
    async jwt({ token, user }) {
      // `user` reste dans la signature bien qu'aucune connexion locale ne le fournisse :
      // Auth.js le passe encore si une session naît par un chemin qu'on n'a pas prévu.
      if (user?.email) token.email = user.email;
      if (!(await decideAcces(token.email, process.env.AUTHORIZED_EMAIL, aAccesHub))) return null;
      return token;
    },
  },
});
