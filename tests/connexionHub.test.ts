// tests/connexionHub.test.ts — où l'on renvoie quelqu'un qui n'a pas de session.

import { describe, it, expect } from "vitest";
import { cheminInterne, urlConnexionHub } from "../lib/connexionHub";

describe("cheminInterne — jamais de tremplin vers un site tiers", () => {
  it("garde un chemin interne, requête comprise", () => {
    expect(cheminInterne("/detail?a=1")).toBe("/detail?a=1");
  });

  it.each([undefined, null, "", "  ", "https://evil.example.com", "//evil.example.com", "/\\evil.example.com", "detail"])(
    "retombe sur / pour %j",
    (valeur) => {
      expect(cheminInterne(valeur)).toBe("/");
    },
  );
});

describe("urlConnexionHub", () => {
  it("envoie au /login du hub avec l'adresse de retour de CETTE app", () => {
    const url = new URL(
      urlConnexionHub("https://app.hubperso.com", "/detail?a=1", "https://hubperso.com"),
    );
    expect(url.origin + url.pathname).toBe("https://hubperso.com/login");
    expect(url.searchParams.get("callbackUrl")).toBe("https://app.hubperso.com/detail?a=1");
  });

  it("une destination externe est ramenée à la racine de l'app", () => {
    const url = new URL(
      urlConnexionHub("https://app.hubperso.com", "https://evil.example.com", "https://hubperso.com"),
    );
    expect(url.searchParams.get("callbackUrl")).toBe("https://app.hubperso.com/");
  });
});
