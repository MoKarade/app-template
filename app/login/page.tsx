// app/login/page.tsx — seule page publique de l'app (avec l'endpoint du hub).
//
// L'app ne se connecte plus à Google elle-même (ADR 0001 de Hubperso) : le hub est la porte
// d'entrée unique. Cette page ne propose donc plus de bouton, elle REDIRIGE vers
// `hubperso.com/login` en emportant de quoi revenir.
//
// Le message d'erreur reste HONNÊTE et distingue les cas : une authentification non
// configurée n'est pas un compte refusé, et il faut pouvoir le comprendre sans lire les
// journaux.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { URL_HUB, urlConnexionHub } from "@/lib/connexionHub";
import { isAuthConfigured } from "@/lib/authConfigured";

export const dynamic = "force-dynamic";

/**
 * L'origine de cette app, vue de la requête.
 *
 * Pas une constante : l'app répond sur son domaine ET sur les préversions Vercel. Coder
 * le domaine en dur ferait revenir toutes les préversions en production après connexion.
 */
async function origineDeLaRequete(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${protocole}://${hote}`;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const configured = isAuthConfigured();

  // Chemin normal : on ne s'attarde pas, on envoie au hub.
  //
  // ⚠️ Pas de redirection si l'auth n'est PAS configurée : sans `AUTH_SECRET`, l'app ne
  // saurait pas lire le cookie que le hub lui rendrait. On bouclerait entre les deux
  // indéfiniment. Mieux vaut s'arrêter ici et le dire.
  if (!error && configured) {
    redirect(urlConnexionHub(await origineDeLaRequete(), callbackUrl));
  }

  return (
    <main className="principal">
      <div className="carte carte-corps">
        <h1>Connexion</h1>

        {!configured && (
          <p className="bandeau erreur">
            Authentification non configurée (AUTH_SECRET / AUTHORIZED_EMAIL manquants). La
            redirection vers le hub est retenue exprès : sans ces variables, l&apos;app ne
            pourrait pas lire la session qu&apos;il lui rendrait, et on tournerait en rond.
          </p>
        )}

        {error && (
          <p className="bandeau erreur">
            Session refusée. Ce compte n&apos;a pas accès à cette app : demande l&apos;accès
            depuis l&apos;administration du hub.
          </p>
        )}

        <p>
          <a className="bouton bouton-principal" href={URL_HUB}>
            Aller au hub
          </a>
        </p>
      </div>
    </main>
  );
}
