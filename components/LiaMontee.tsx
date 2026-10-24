"use client";

// LIA, démarrée HORS du rendu pour toute l'app (Marc, 23/10/2026 : « présente tout le temps, même si
// quelque chose charge, même si une page bug »). `demarrerLia` se pose dans `document.body` avant
// l'hydratation et survit aux écrans de chargement et aux error boundaries : l'appel est donc ICI, au
// chargement du module, jamais dans un effet ni dans le corps du composant. Le layout racine et
// `global-error.tsx` rendent ce composant (qui ne dessine rien) pour que le module soit chargé ; tout ce
// qui se décide est dans lib/lia/. Une seule voie : `demarrerLia` OU `<Lia />`, jamais les deux.
// Mode invité (24/10/2026) : LIA est aussi là sur `/login` et dans les écrans d'erreur, sans session ;
// son `ask` ne part alors pas sur le réseau (lib/lia/askInvite.ts). Le layout dit si la session est admise.

import { demarrerLia } from "@mokarade/lia-ui/boot";
import { useEffect } from "react";
import { creerAskInvite, creerIndicateurSession } from "@/lib/lia/askInvite";
import { demanderLia } from "@/lib/lia/client";

const session = creerIndicateurSession();

// Le module est aussi évalué côté serveur (rendu initial) : pas de document là-bas.
if (typeof window !== "undefined") {
  demarrerLia({
    ask: creerAskInvite(session, (question, signal) => demanderLia(question, signal, { page: window.location.pathname })),
  });
}

export default function LiaMontee({ session: admise = false }: { session?: boolean }) {
  // Dans un effet (jamais au rendu) : le drapeau vit côté navigateur seulement, pas partagé entre requêtes serveur.
  useEffect(() => {
    if (admise) session.activer();
  }, [admise]);
  return null;
}
