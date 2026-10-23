// tests/liaMontee.test.ts — LIA est UNE seule, identique dans toutes les apps et dans le hub (Marc, 23/10/2026) :
// le mouvement (« complet » par défaut) et la pastille d'humeur viennent du paquet lia-ui, l'app n'en règle aucun.
// Verrou de source : ces options ne sont lues qu'au montage par lia-ui, un test de rendu ne les verrait pas.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "..", "components", "LiaMontee.tsx"), "utf8");
const paquet = readFileSync(join(__dirname, "..", "package.json"), "utf8");
const layout = readFileSync(join(__dirname, "..", "app", "layout.tsx"), "utf8");

function sources(dossier: string): string[] {
  return readdirSync(join(__dirname, "..", dossier), { recursive: true, encoding: "utf8" })
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => join(dossier, f));
}

describe("LiaMontee : réglages communs", () => {
  it("ne règle ni le mouvement réduit ni la pastille d'humeur (défauts du paquet)", () => {
    expect(source).not.toContain("quandMouvementReduit");
    expect(source).not.toContain("humeurVisible");
  });

  it("utilise lia-ui v0.16.0 ou plus récent (mouvement complet par défaut, pastille d'humeur du paquet)", () => {
    const m = /"@mokarade\/lia-ui": "github:MoKarade\/lia-ui#v(\d+)\.(\d+)\.(\d+)"/.exec(paquet);
    expect(m, "l'épingle de lia-ui doit être un tag vX.Y.Z").not.toBeNull();
    const [major = 0, minor = 0, patch = 0] = (m ?? []).slice(1).map(Number);
    expect(major > 0 || minor > 16 || (minor === 16 && patch >= 0)).toBe(true);
  });
});

describe("LiaMontee : LIA présente tout le temps (demarrerLia)", () => {
  it("importe demarrerLia du sous-chemin boot du paquet", () => {
    expect(source).toContain('import { demarrerLia } from "@mokarade/lia-ui/boot"');
  });

  it("appelle demarrerLia au chargement du module (niveau racine, gardé par window), pas dans un effet ni un composant", () => {
    expect(source).toMatch(/^if \(typeof window !== "undefined"\) \{\n {2}demarrerLia\(/m);
    expect(source).not.toContain("useEffect");
    const composant = /export default function LiaMontee\(\) \{([\s\S]*?)\n\}/.exec(source);
    expect(composant, "composant LiaMontee introuvable").not.toBeNull();
    expect(composant?.[1]).not.toContain("demarrerLia");
  });

  it("le layout racine rend LiaMontee (sinon le module n'est jamais chargé côté navigateur)", () => {
    expect(layout).toContain("<LiaMontee />");
  });

  it("aucun <Lia /> ni import de @mokarade/lia-ui/react dans l'app : une seule voie, une seule LIA par page", () => {
    for (const f of [...sources("app"), ...sources("components"), ...sources("lib")]) {
      // Sans les commentaires : celui de LiaMontee cite `<Lia />` pour dire de ne pas l'utiliser.
      const texte = readFileSync(join(__dirname, "..", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(texte, `${f} ne doit pas monter <Lia />`).not.toMatch(/<Lia[\s/>]/);
      expect(texte, `${f} ne doit pas importer @mokarade/lia-ui/react`).not.toContain("@mokarade/lia-ui/react");
    }
  });
});
