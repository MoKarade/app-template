import type { Metadata } from "next";
import "./globals.css";
import LiaMontee from "@/components/LiaMontee";
import NavApps from "@/components/NavApps";
import { liaAutorisee } from "@/lib/lia/monter";
import { APP_COURANTE, navAppsAutorisee } from "@/lib/navApps/monter";

export const metadata: Metadata = {
  title: "App Template",
  description: "Squelette d'app hub perso.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lia, navApps] = await Promise.all([liaAutorisee(), navAppsAutorisee()]);
  return (
    <html lang="fr-CA">
      <body>
        {navApps && <NavApps courant={APP_COURANTE} />}
        {children}
        <LiaMontee session={lia} />
      </body>
    </html>
  );
}
