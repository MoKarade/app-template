// tests/theme.test.ts — verrou du socle visuel commun (tâche #39).
//
// Les couleurs vivent dans `app/globals.css`, en variables, et NULLE PART ailleurs. Ces tests
// partent avec le fork : ils empêchent la dérive que les apps réelles ont connue (repris de
// BatchChef, `web/tests/theme.test.ts`).
//
// Pourquoi un test et pas une relecture — incident BatchChef du 14/08/2026 : une passe de
// refonte avait laissé 21 `bg-white` figés sous un texte clair hérité en thème sombre. Une
// couleur figée est parfaitement lisible dans le thème pour lequel on l'a écrite : aucune
// relecture ne la voit, aucune erreur ne se lève. Il faut une machine qui les compte.
//
// Différence avec BatchChef : ici le thème SUIT LE SYSTÈME (clair + sombre), donc la
// vérification « chaque couleur est redéfinie en sombre » existe encore.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = process.cwd();

/**
 * PÉRIMÈTRE POSITIF : les dossiers qui produisent du balisage.
 *
 * Pas « tout sauf les tests » : un garde qui s'exclut d'un dossier entier s'en exclut pour
 * toujours. `tests/` n'est pas exempté, il est hors sujet.
 */
const DOSSIERS_RENDUS = ["app", "components", "lib"];

function fichiersDe(dossier: string): string[] {
  const absolu = join(RACINE, dossier);
  try {
    statSync(absolu);
  } catch {
    return []; // `components/` n'existe pas encore dans le squelette
  }
  return readdirSync(absolu, { recursive: true, encoding: "utf8" })
    .map((f) => join(dossier, f).split("\\").join("/"))
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
}

const FICHIERS = DOSSIERS_RENDUS.flatMap(fichiersDe).sort();

function lire(chemin: string): string {
  return readFileSync(join(RACINE, chemin), "utf8");
}

function parLigne(fichier: string, motif: RegExp): string[] {
  const fautes: string[] = [];
  lire(fichier)
    .split("\n")
    .forEach((ligne, i) => {
      for (const trouvee of ligne.match(motif) ?? []) {
        fautes.push(`${relative(".", fichier)}:${i + 1} — ${trouvee}`);
      }
    });
  return fautes;
}

const CSS = lire("app/globals.css");

/** Corps du premier bloc `:root { … }` (thème clair) et de celui du bloc sombre. */
function blocs(): { clair: string; sombre: string } {
  const corps = (source: string, debut: number): string => {
    const ouvre = source.indexOf("{", debut);
    let profondeur = 0;
    for (let i = ouvre; i < source.length; i++) {
      if (source[i] === "{") profondeur++;
      if (source[i] === "}" && --profondeur === 0) return source.slice(ouvre + 1, i);
    }
    throw new Error("accolade non fermée dans globals.css");
  };
  const clair = corps(CSS, CSS.indexOf(":root"));
  const media = CSS.indexOf("@media (prefers-color-scheme: dark)");
  expect(media, "globals.css doit porter un bloc @media (prefers-color-scheme: dark)")
    .toBeGreaterThan(-1);
  const interieur = corps(CSS, media);
  const sombre = corps(interieur, interieur.indexOf(":root"));
  return { clair, sombre };
}

const { clair, sombre } = blocs();

/** `--nom: #rrggbb;` — les couleurs sont en hexadécimal, ce qui les rend mesurables. */
function couleurs(source: string): [string, string][] {
  return [...source.matchAll(/^\s*(--[a-z-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gim)].map(
    (m) => [m[1] ?? "", (m[2] ?? "").toLowerCase()] as [string, string],
  );
}

describe("socle visuel — aucune couleur hors des jetons", () => {
  it("voit bien les fichiers de rendu (sinon le garde est vert à vide)", () => {
    // Un scan qui ne trouve rien passe tous les tests suivants sans rien vérifier.
    expect(FICHIERS.length).toBeGreaterThan(5);
    expect(FICHIERS).toContain("app/page.tsx");
    expect(FICHIERS).toContain("app/login/page.tsx");
  });

  it("aucune classe de palette Tailwind (elle ne connaît pas prefers-color-scheme)", () => {
    const palettes =
      "white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
    const proprietes =
      "bg|text|border|placeholder|ring|from|to|via|divide|decoration|outline|accent|caret|fill|stroke|shadow";
    const motif = new RegExp(
      `\\b(?:${proprietes})-(?:${palettes})(?:-\\d{2,3})?(?:/\\d{1,3})?\\b`,
      "g",
    );
    const fautes = FICHIERS.flatMap((f) => parLigne(f, motif));
    expect(fautes, `Couleurs figées (utilise un jeton de globals.css) :\n${fautes.join("\n")}`)
      .toEqual([]);
  });

  it("aucune valeur de couleur (#hex, rgb, hsl, oklch…) dans un composant", () => {
    // Exception NOMMÉE, avec son motif : `color` du summary est un champ du CONTRAT du hub
    // (couleur d'accent du widget, `#rrggbb`), pas une couleur de l'interface de l'app.
    const exceptions = [{ fichier: "app/hub/summary/route.ts", valeur: "#6366f1" }];
    const motif = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g;
    const fautes = FICHIERS.flatMap((f) =>
      parLigne(f, motif).filter(
        (faute) => !exceptions.some((e) => faute.startsWith(`${e.fichier}:`) && faute.endsWith(e.valeur)),
      ),
    );
    expect(fautes, `Couleurs en dur (déclare un jeton dans globals.css) :\n${fautes.join("\n")}`)
      .toEqual([]);
  });

  it("chaque `var(--jeton)` cité est défini dans globals.css", () => {
    // Un nom mal orthographié ne lève rien : la propriété devient invalide et la couleur est
    // simplement héritée. Silencieux, et joli dans le thème où on l'a écrit.
    const definis = new Set(
      [...CSS.matchAll(/^\s*(--[a-z-]+)\s*:/gm)].map((m) => m[1]),
    );
    const citations = [
      ...FICHIERS.flatMap((f) => parLigne(f, /var\(\s*--[a-z-]+/g).map((x) => [f, x] as const)),
      ...[...CSS.matchAll(/var\(\s*(--[a-z-]+)/g)].map((m) => ["app/globals.css", m[1] ?? ""] as const),
    ];
    const fautes = citations
      .map(([f, x]) => `${f} — ${x.replace(/var\(\s*/, "")}`)
      .filter((x) => !definis.has(x.split(" — ")[1]));
    expect(fautes, `Jetons inexistants :\n${fautes.join("\n")}`).toEqual([]);
  });

  it("chaque classe statique utilisée dans le balisage est définie dans globals.css", () => {
    // Avant ce socle, la page de connexion citait `login__btn` et `login__error` : aucune
    // règle ne les définissait, la page s'affichait sans style et rien ne le disait.
    const definies = new Set([...CSS.matchAll(/\.([a-z][a-z0-9-]*)/gi)].map((m) => m[1]));
    const fautes: string[] = [];
    for (const fichier of FICHIERS.filter((f) => f.endsWith(".tsx"))) {
      lire(fichier)
        .split("\n")
        .forEach((ligne, i) => {
          for (const m of ligne.matchAll(/className="([^"]+)"/g)) {
            for (const classe of (m[1] ?? "").split(/\s+/).filter(Boolean)) {
              if (!definies.has(classe)) fautes.push(`${fichier}:${i + 1} — ${classe}`);
            }
          }
        });
    }
    expect(fautes, `Classes sans règle (ajoute-la au vocabulaire ou retire-la) :\n${fautes.join("\n")}`)
      .toEqual([]);
  });
});

describe("socle visuel — clair ET sombre", () => {
  it("suit le système : color-scheme `light dark`", () => {
    expect(clair).toMatch(/color-scheme:\s*light\s+dark\s*;/);
  });

  it("chaque couleur est définie une seule fois par thème", () => {
    for (const [nom, bloc] of [["clair", clair], ["sombre", sombre]] as const) {
      const noms = couleurs(bloc).map(([n]) => n);
      expect(noms.length, `thème ${nom} : trop peu de jetons lus, le garde serait vide`)
        .toBeGreaterThan(15);
      const doublons = noms.filter((n, i) => noms.indexOf(n) !== i);
      expect(doublons, `thème ${nom} : jetons définis deux fois`).toEqual([]);
    }
  });

  it("chaque couleur du thème clair est redéfinie en sombre, et inversement", () => {
    // C'est le défaut du 14/08 : une couleur oubliée en sombre garde sa valeur claire.
    const c = couleurs(clair).map(([n]) => n);
    const s = couleurs(sombre).map(([n]) => n);
    expect(c.filter((n) => !s.includes(n)), "absentes du thème sombre").toEqual([]);
    expect(s.filter((n) => !c.includes(n)), "absentes du thème clair").toEqual([]);
  });

  it("porte le vocabulaire commun (un renommage casserait les forks en silence)", () => {
    const noms = couleurs(clair).map(([n]) => n);
    for (const requis of [
      "--fond", "--surface", "--surface-douce", "--bordure", "--bordure-champ",
      "--texte", "--texte-doux", "--accent", "--accent-fonce", "--sur-accent",
      "--repere", "--repere-doux",
      "--succes-fond", "--succes-texte", "--alerte-fond", "--alerte-texte",
      "--erreur-fond", "--erreur-texte",
    ]) {
      expect(noms, `jeton manquant : ${requis}`).toContain(requis);
    }
    const classes = new Set([...CSS.matchAll(/\.([a-z][a-z0-9-]*)/gi)].map((m) => m[1]));
    for (const requise of [
      "carte", "bouton", "bouton-principal", "bouton-second", "bouton-danger", "champ",
      "doux", "succes", "alerte", "erreur", "pastille", "bandeau", "surtitre",
    ]) {
      expect(classes, `classe manquante : .${requise}`).toContain(requise);
    }
  });

  it("les couples texte/fond passent le WCAG dans les DEUX thèmes (texte 4,5:1 ; contour 3:1)", () => {
    const lin = (c: number): number => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    const lum = (hex: string): number => {
      const n = parseInt(hex.slice(1), 16);
      return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    };
    const ratio = (a: string, b: string): number => {
      const [x = 0, y = 0] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    // [premier plan, arrière-plan, minimum]. 4,5 = texte ; 3 = composant d'interface (1.4.11).
    const couples: [string, string, number][] = [
      ["--texte", "--fond", 4.5],
      ["--texte", "--surface", 4.5],
      ["--texte", "--surface-douce", 4.5],
      ["--texte-doux", "--fond", 4.5],
      ["--texte-doux", "--surface", 4.5],
      ["--texte-doux", "--surface-douce", 4.5],
      ["--sur-accent", "--accent", 4.5],
      ["--sur-accent", "--accent-fonce", 4.5],
      ["--repere", "--fond", 4.5],
      ["--repere", "--surface", 4.5],
      ["--repere", "--repere-doux", 4.5],
      ["--succes-texte", "--succes-fond", 4.5],
      ["--alerte-texte", "--alerte-fond", 4.5],
      ["--erreur-texte", "--erreur-fond", 4.5],
      ["--erreur-texte", "--surface", 4.5],
      ["--bordure-champ", "--surface", 3],
      ["--bordure-champ", "--fond", 3],
      ["--accent", "--fond", 3],
    ];
    const tropBas: string[] = [];
    for (const [nom, bloc] of [["clair", clair], ["sombre", sombre]] as const) {
      const v = Object.fromEntries(couleurs(bloc)) as Record<string, string>;
      for (const [a, b, min] of couples) {
        const fa = v[a];
        const fb = v[b];
        if (!fa || !fb) {
          tropBas.push(`${nom} : ${a} / ${b} : jeton introuvable`);
          continue;
        }
        const r = ratio(fa, fb);
        if (r < min) tropBas.push(`${nom} : ${a} ${fa} / ${b} ${fb} : ${r.toFixed(2)}:1 < ${min}:1`);
      }
    }
    expect(tropBas, `Contrastes insuffisants :\n${tropBas.join("\n")}`).toEqual([]);
  });
});

describe("socle visuel — cibles tactiles et champs", () => {
  /** Corps de la règle `.classe { … }` (la première, hors pseudo-classes). */
  function regle(classe: string): string {
    const m = CSS.match(new RegExp(`^\\.${classe}\\s*\\{([^}]*)\\}`, "m"));
    expect(m, `règle .${classe} introuvable`).not.toBeNull();
    return m?.[1] ?? "";
  }

  it("`.bouton` et `.champ` font au moins 44 px de haut", () => {
    for (const classe of ["bouton", "champ"]) {
      const m = regle(classe).match(/min-height:\s*([\d.]+)rem/);
      expect(m, `.${classe} : min-height en rem attendu`).not.toBeNull();
      expect(Number(m?.[1]) * 16, `.${classe} : hauteur minimale en px`).toBeGreaterThanOrEqual(44);
    }
  });

  it("`.champ` est à 16 px au moins (en dessous, iOS zoome tout seul)", () => {
    const m = regle("champ").match(/font-size:\s*([\d.]+)rem/);
    expect(m, ".champ : font-size en rem attendu").not.toBeNull();
    expect(Number(m?.[1]) * 16).toBeGreaterThanOrEqual(16);
  });
});
