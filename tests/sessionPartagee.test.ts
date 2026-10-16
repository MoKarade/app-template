import { describe, it, expect } from "vitest";
import { cookiesSessionPartagee } from "@/lib/sessionPartagee";

describe("cookiesSessionPartagee", () => {
  it("retourne undefined lorsque le domaine est undefined", () => {
    expect(cookiesSessionPartagee(undefined)).toBeUndefined();
  });

  it("retourne undefined lorsque le domaine est une chaîne vide", () => {
    expect(cookiesSessionPartagee("")).toBeUndefined();
  });

  it("retourne undefined lorsque le domaine ne contient que des espaces", () => {
    expect(cookiesSessionPartagee("   ")).toBeUndefined();
  });

  it("contient la clé sessionToken lorsque le domaine est fourni", () => {
    const resultat = cookiesSessionPartagee(".hubperso.com");
    expect(resultat?.sessionToken).toBeDefined();
  });

  it("ne contient aucune clé csrfToken car le préfixe __Host- interdit l'attribut Domain", () => {
    const resultat = cookiesSessionPartagee(".hubperso.com");
    expect(resultat).not.toHaveProperty("csrfToken");
  });

  it("définit le nom du cookie à __Secure-authjs.session-token", () => {
    const resultat = cookiesSessionPartagee(".hubperso.com");
    expect(resultat?.sessionToken?.name).toBe("__Secure-authjs.session-token");
  });

  it("définit les options de cookie requises pour le partage de session", () => {
    const resultat = cookiesSessionPartagee(".hubperso.com");
    expect(resultat?.sessionToken?.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      domain: ".hubperso.com",
    });
  });

  it("rend un domaine entouré d'espaces sans espaces", () => {
    const resultat = cookiesSessionPartagee("  .hubperso.com  ");
    expect(resultat?.sessionToken?.options?.domain).toBe(".hubperso.com");
  });
});
