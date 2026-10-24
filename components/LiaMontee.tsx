"use client";

// LIA, démarrée HORS du rendu pour toute l'app (Marc, 23/10/2026 : « présente tout le temps, même si
// quelque chose charge, même si une page bug »). `demarrerLia` se pose dans `document.body` avant
// l'hydratation et survit aux écrans de chargement et aux error boundaries : l'appel est donc ICI, au
// chargement du module, jamais dans un effet ni dans le corps du composant. Le layout racine rend ce
// composant (qui ne dessine rien) pour que le module soit chargé ; tout ce qui se décide est dans lib/lia/.
// Une seule voie : `demarrerLia` OU `<Lia />`, jamais les deux (une seule LIA par page).

import { demarrerLia } from "@mokarade/lia-ui/boot";
import { demanderLia } from "@/lib/lia/client";

// Le module est aussi évalué côté serveur (rendu initial) : pas de document là-bas.
if (typeof window !== "undefined") {
  demarrerLia({ ask: (question, signal) => demanderLia(question, signal, { page: window.location.pathname }) });
}

export default function LiaMontee() {
  return null;
}
