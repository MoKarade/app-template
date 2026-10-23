// tests/liaMontee.test.ts — LIA est UNE seule, identique dans toutes les apps et dans le hub (Marc, 23/10/2026) :
// le mouvement (« complet » par défaut) et la pastille d'humeur viennent du paquet lia-ui, l'app n'en règle aucun.
// Verrou de source : ces options ne sont lues qu'au montage par lia-ui, un test de rendu ne les verrait pas.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(__dirname, "..", "components", "LiaMontee.tsx"), "utf8");
const paquet = readFileSync(join(__dirname, "..", "package.json"), "utf8");

describe("LiaMontee : réglages communs", () => {
  it("ne règle ni le mouvement réduit ni la pastille d'humeur (défauts du paquet)", () => {
    expect(source).not.toContain("quandMouvementReduit");
    expect(source).not.toContain("humeurVisible");
  });

  it("utilise lia-ui v0.14.0 ou plus récent (mouvement complet par défaut, pastille d'humeur du paquet)", () => {
    const m = /"@mokarade\/lia-ui": "github:MoKarade\/lia-ui#v(\d+)\.(\d+)\.(\d+)"/.exec(paquet);
    expect(m, "l'épingle de lia-ui doit être un tag vX.Y.Z").not.toBeNull();
    const [major = 0, minor = 0, patch = 0] = (m ?? []).slice(1).map(Number);
    expect(major > 0 || minor > 14 || (minor === 14 && patch >= 0)).toBe(true);
  });
});
