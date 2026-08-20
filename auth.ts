// auth.ts
//
// Auth.js (NextAuth v5), patron commun des apps privées de l'écosystème : elles affichent
// des données personnelles réelles, donc elles sont derrière un login Google.
//
// ── QUI A LE DROIT D'ENTRER : DEUX ÉTAGES, PAS UN SEUL (ADR 0001 du hub) ─────────────
//
// 1. `AUTHORIZED_EMAIL` = le PROPRIÉTAIRE. Vérifié en PREMIER et SANS réseau. Ce n'est
//    plus « la seule adresse admise » : c'est l'échappatoire qui garantit qu'une panne du
//    hub — ou une ligne supprimée par erreur — ne peut pas enfermer Marc dehors de sa
//    propre app.
// 2. Tout le monde d'autre : `aAccesHub` interroge la table `acces` du hub. C'est là, et
//    seulement là, que vit la liste. Inviter quelqu'un depuis `hubperso.com/administration`
//    doit suffire à lui ouvrir cette app, SANS toucher à `AUTHORIZED_EMAIL` ici ni
//    redéployer quoi que ce soit.
//
// ── LE CONTRÔLE EST REJOUÉ, PAS FAIT UNE FOIS ────────────────────────────────────────
//
// `signIn` ne tourne qu'à la CONNEXION. Le cookie de session étant partagé entre les
// sous-domaines de hubperso.com (voir `lib/sessionPartagee.ts`), cette app accepterait
// sans broncher une session fabriquée par une AUTRE app du hub — or un accès accordé pour
// une seule app ne doit pas ouvrir les autres. Le callback `jwt`, lui, tourne à CHAQUE
// lecture de session : c'est lui qui rend la révocation réelle. Renvoyer `null` invalide
// la session (Auth.js v5).
//
// Session en JWT : pas de base de données requise pour l'auth. Les identifiants OAuth et
// le secret viennent TOUS de l'environnement, jamais du code (cf. `.env.example`).
//
// ── AU FORK ──────────────────────────────────────────────────────────────────────────
//
// Rien à changer dans ce fichier. Il reste à : (1) poser les variables d'environnement,
// (2) déclarer le redirect URI de la nouvelle app côté Google Cloud, (3) ajouter l'app
// dans `lib/sources.ts` du hub — c'est ce qui la fait apparaître dans /administration et
// rend son accès attribuable.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAuthorizedEmail } from "@/lib/authorized";
import { aAccesHub } from "@/lib/accesHub";
import { cookiesSessionPartagee } from "@/lib/sessionPartagee";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
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
  // Requis en local/self-hosted (sinon Auth.js lève UntrustedHost). Sans risque : les
  // redirect URIs sont verrouillés côté Google — un host forgé ne matcherait aucun
  // callback autorisé. Sur Vercel c'est de toute façon le comportement par défaut.
  trustHost: true,
  pages: {
    signIn: "/login",
    // Le refus d'un compte non autorisé est une ERREUR côté Auth.js : on la rend par
    // /login, qui lit `?error=` et affiche un message honnête plutôt qu'une page brute.
    error: "/login",
  },
  callbacks: {
    // `false` → Auth.js refuse et redirige vers /login?error=AccessDenied. Aucune session
    // n'est créée : quelqu'un sans accès ne repart pas avec un cookie inerte.
    async signIn({ user }) {
      if (isAuthorizedEmail(user?.email, process.env.AUTHORIZED_EMAIL)) return true;
      return await aAccesHub(user?.email);
    },
    async jwt({ token, user }) {
      // Revérification à CHAQUE lecture (voir l'en-tête). L'adresse est recopiée depuis
      // `user` à la connexion : sans ça, `token.email` serait vide au premier passage et
      // la session serait invalidée aussitôt créée.
      if (user?.email) token.email = user.email;
      if (
        !isAuthorizedEmail(token.email, process.env.AUTHORIZED_EMAIL) &&
        !(await aAccesHub(token.email))
      ) {
        return null;
      }
      return token;
    },
  },
});
