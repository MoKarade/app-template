// Page d'accueil minimale et honnête : l'app démarre « en construction ».
// Au fork, remplace-la par ta vraie interface.
//
// `requireSession()` est le patron de TOUTE page ou Server Action qui affiche ou écrit des
// données : le middleware garde déjà la porte, mais une erreur de matcher suffirait à
// l'ouvrir en silence — deux gardes indépendantes, une seule à se tromper.

import { requireSession } from "@/lib/session";

// Dynamique : `requireSession()` lit les cookies de la requête. Sans cette ligne, `next build`
// tente de prérendre la page, sans requête ni variables d'auth, et le build échoue.
export const dynamic = "force-dynamic";

export default async function Home() {
  await requireSession();
  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">hubperso.com</p>
        <h1>App Template</h1>
        <p className="lead">
          Squelette prêt à forker. L’endpoint <code>/hub/summary</code> est déjà branché sur
          le hub (contrat v1) et renvoie un état « en construction » tant que le moteur
          n’est pas actif.
        </p>
        <p className="hint">
          Remplace ce contenu par ta vraie interface, et le <code>buildingSummary</code> de{" "}
          <code>app/hub/summary/route.ts</code> par tes vraies données quand elles existent.
        </p>
      </div>
    </main>
  );
}
