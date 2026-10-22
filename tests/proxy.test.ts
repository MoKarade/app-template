// tests/proxy.test.ts — verrou du câblage de la garde : `proxy.ts`, et son matcher.
//
// Pourquoi : Next 16 a renommé `middleware` en `proxy` (v16.0.0, doc « Migration to Proxy »).
// `tests/auth.test.ts` prouve la DÉCISION (`decideGuard`, `isPublicPath`), pas son branchement :
// un fichier mal nommé, ou un matcher qui dérive de `isPublicPath`, laisserait les tests
// verts alors que la garde ne tourne plus — ou que `/hub/summary` tombe derrière la session.
// On lit donc le fichier lui-même. (Le matcher doit rester une constante littérale : Next
// l'analyse statiquement, on ne peut pas l'importer d'ailleurs.)

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPublicPath } from "../lib/authGuard";

const source = readFileSync("proxy.ts", "utf8");

/** Le motif du matcher, tel qu'écrit dans `proxy.ts` (littéral JSON de chaîne, déséchappé). */
function motifDuMatcher(): RegExp {
  const bloc = /matcher:\s*\[\s*("(?:[^"\\]|\\.)*")\s*,?\s*\]/.exec(source);
  if (!bloc) throw new Error("matcher introuvable dans proxy.ts : un seul motif littéral attendu");
  return new RegExp(`^${JSON.parse(bloc[1]!) as string}$`);
}

const protege = (chemin: string) => motifDuMatcher().test(chemin);

describe("proxy.ts — la garde est branchée sous le nom que Next 16 attend", () => {
  it("existe, et `middleware.ts` n'existe plus (nom déprécié depuis Next 16.0.0)", () => {
    expect(existsSync("proxy.ts")).toBe(true);
    expect(existsSync("middleware.ts")).toBe(false);
  });

  it("exporte par défaut la garde Auth.js", () => {
    expect(source).toMatch(/export default auth\(/);
  });
});

describe("proxy.ts — le matcher", () => {
  it("laisse /hub/summary HORS de la garde de session (il porte son jeton)", () => {
    expect(protege("/hub/summary")).toBe(false);
  });

  it.each(["/", "/dossiers", "/api/donnees", "/hub/autre", "/api/lia/ask"])(
    "garde `%s`, route de données sans session = refusée",
    (chemin) => {
      expect(protege(chemin)).toBe(true);
    },
  );

  it.each([
    "/",
    "/dossiers",
    "/api/donnees",
    "/api/lia/ask",
    "/hub/summary",
    "/login",
    "/api/auth/session",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/manifest.webmanifest",
  ])("est d'accord avec `isPublicPath` sur `%s`", (chemin) => {
    expect(protege(chemin)).toBe(!isPublicPath(chemin));
  });
});
