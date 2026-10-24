"use client";

// app/global-error.tsx — dernier filet : une erreur de rendu que rien d'autre n'attrape.
// Elle est envoyée à Sentry (éteint sans DSN, voir lib/sentryConfig.ts) puis l'écran dit
// honnêtement qu'il y a eu un problème. Aucun détail technique n'est affiché. LIA y reste présente
// (mode invité si la session n'est pas connue ici).

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import LiaMontee from "@/components/LiaMontee";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr-CA">
      <body>
        <main className="carte">
          <h1>Un problème est survenu</h1>
          <p className="doux">L&apos;erreur a été signalée. Recharge la page pour réessayer.</p>
        </main>
        <LiaMontee />
      </body>
    </html>
  );
}
