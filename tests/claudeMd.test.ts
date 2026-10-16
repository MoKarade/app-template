// tests/claudeMd.test.ts — verrou de CLAUDE.md : court, cinq titres, et rien de perdu.
//
// Pourquoi : CLAUDE.md se charge en entier à CHAQUE session de CHAQUE fork. Il était passé à
// 260 lignes ; le standard des dépôts (15/10/2026, §2) le plafonne à 60 et renvoie le détail à
// `docs/claude/`. Ce test garde les deux moitiés : le fichier reste court, et chaque fichier du
// détail reste atteignable depuis l'index (sinon la doc déplacée devient de la doc perdue).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claude = readFileSync("CLAUDE.md", "utf8");
const dossier = "docs/claude";
const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".md"));

describe("CLAUDE.md — court, cinq titres, détail dans docs/claude/", () => {
  it("fait 60 lignes au plus", () => {
    const lignes = claude.replace(/\n$/, "").split("\n").length;
    expect(lignes, "CLAUDE.md dépasse 60 lignes : le détail va dans docs/claude/").toBeLessThanOrEqual(60);
  });

  it("porte les cinq titres du standard, dans l'ordre", () => {
    const titres = [...claude.matchAll(/^## (.+)$/gm)].map((m) => m[1]!.replace(/\s*\(.*$/, ""));
    expect(titres).toEqual([
      "Contexte",
      "Commandes",
      "Règles propres au dépôt",
      "Git et CI",
      "Pour aller plus loin",
    ]);
  });

  it("n'importe pas la convention de compte-rendu (une importation relit ~4,5 k jetons à chaque appel)", () => {
    expect(claude).not.toMatch(/^@docs\//m);
  });

  it("cite chaque fichier de docs/claude/ dans l'index, et chacun existe", () => {
    expect(fichiers.length).toBeGreaterThan(0);
    for (const f of fichiers) {
      const nom = f.replace(/\.md$/, "");
      expect(claude, `${dossier}/${f} n'est pas cité dans l'index de CLAUDE.md`).toContain(nom);
      expect(existsSync(`${dossier}/${f}`)).toBe(true);
    }
  });

  it("garde les avertissements ⚠️ de l'ancien fichier (11 au 16/10/2026) : le détail n'en perd aucun", () => {
    const total = fichiers
      .map((f) => readFileSync(`${dossier}/${f}`, "utf8"))
      .reduce((n, texte) => n + (texte.match(/⚠️/g)?.length ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(11);
  });
});
