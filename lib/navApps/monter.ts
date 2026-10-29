// lib/navApps/monter.ts — dit si l'onglet « Apps » se monte, et quelle app il habille.
// Propriétaire seulement (AUTHORIZED_EMAIL, sans réseau) : un invité admis par le hub ne le voit pas,
// et la page de connexion (sans session) non plus. Échec fermé : toute autre erreur remonte.

import type { AppId } from "@/lib/appsDuParc";
import { isAuthorizedEmail } from "@/lib/authorized";
import { NonAutorise, requireSession } from "@/lib/session";

/**
 * Id de CETTE app dans `lib/appsDuParc.ts` : l'onglet ne la propose pas. UNE ligne à changer au fork
 * (doit être l'un des `AppId`, sinon `autresApps` lève). Le squelette n'est pas une app du parc : il emprunte « carai ».
 */
export const APP_COURANTE: AppId = "carai";

export async function navAppsAutorisee(): Promise<boolean> {
  try {
    const { email } = await requireSession();
    return isAuthorizedEmail(email, process.env.AUTHORIZED_EMAIL);
  } catch (erreur) {
    if (erreur instanceof NonAutorise) return false;
    throw erreur;
  }
}
