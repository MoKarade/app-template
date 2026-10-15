// tests/decisionAcces.test.ts — qui a le droit d'entrer : deux étages, dans cet ordre.
//
// Adresses fictives uniquement (example.com).

import { describe, it, expect, vi } from "vitest";
import { decideAcces } from "../lib/decisionAcces";

const PROPRIETAIRE = "proprio@example.com";

describe("decideAcces — session absente", () => {
  it.each([null, undefined, "", "   "])("refuse %j sans interroger le hub", async (email) => {
    const hub = vi.fn().mockResolvedValue(true);
    expect(await decideAcces(email, PROPRIETAIRE, hub)).toBe(false);
    expect(hub).not.toHaveBeenCalled();
  });
});

describe("decideAcces — le propriétaire (étage 1, sans réseau)", () => {
  it("entre sans que le hub soit interrogé, casse et espaces ignorés", async () => {
    const hub = vi.fn().mockResolvedValue(false);
    expect(await decideAcces(" Proprio@Example.COM ", PROPRIETAIRE, hub)).toBe(true);
    expect(hub).not.toHaveBeenCalled();
  });

  // La raison d'être de l'étage 1 : un hub en panne ne doit pas enfermer le propriétaire.
  it("entre même si le hub est injoignable", async () => {
    const hub = vi.fn().mockRejectedValue(new Error("hub injoignable"));
    expect(await decideAcces(PROPRIETAIRE, PROPRIETAIRE, hub)).toBe(true);
  });
});

describe("decideAcces — un autre utilisateur (étage 2, le hub)", () => {
  it("est refusé quand le hub répond non", async () => {
    const hub = vi.fn().mockResolvedValue(false);
    expect(await decideAcces("autre@example.com", PROPRIETAIRE, hub)).toBe(false);
    expect(hub).toHaveBeenCalledExactlyOnceWith("autre@example.com");
  });

  it("entre quand le hub répond oui (invité depuis l'administration)", async () => {
    const hub = vi.fn().mockResolvedValue(true);
    expect(await decideAcces("invite@example.com", PROPRIETAIRE, hub)).toBe(true);
  });

  // Échec fermé : ici le hub LÈVE ; `aAccesHub` attrape et répond false (tests/accesHub.test.ts),
  // mais une décision ne doit jamais laisser entrer sur une exception non attrapée.
  it("ne laisse pas entrer si la question au hub lève", async () => {
    const hub = vi.fn().mockRejectedValue(new Error("hub injoignable"));
    await expect(decideAcces("autre@example.com", PROPRIETAIRE, hub)).rejects.toThrow();
  });

  it("est refusé quand AUTHORIZED_EMAIL n'est pas configuré et que le hub dit non", async () => {
    const hub = vi.fn().mockResolvedValue(false);
    expect(await decideAcces("proprio@example.com", undefined, hub)).toBe(false);
  });
});
