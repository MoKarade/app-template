import type { Metadata } from "next";
import "./globals.css";
import LiaMontee from "@/components/LiaMontee";
import { liaAutorisee } from "@/lib/lia/monter";

export const metadata: Metadata = {
  title: "App Template",
  description: "Squelette d'app hub perso.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lia = await liaAutorisee();
  return (
    <html lang="fr-CA">
      <body>
        {children}
        {lia ? <LiaMontee /> : null}
      </body>
    </html>
  );
}
