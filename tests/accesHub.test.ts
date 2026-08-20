// tests/accesHub.test.ts — « ai-je le droit d'entrer ICI ? », posée au hub.
//
// Les cas qui comptent sont ceux du REFUS et ceux du CACHE. Une autorisation accordée par
// erreur ne se voit pas ; un refus injustifié se signale tout seul. Et un cache qui garde
// une réponse trop longtemps produit exactement les deux : une révocation qui ne révoque
// rien, ou une invitation qui n'invite pas encore.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_ACCES_MS, aAccesHub, viderCacheAcces } from "../lib/accesHub";

const ENV = { HUB_TOKEN: "jeton-factice-de-test" };
const INVITEE = "quelquun@exemple.com";

beforeEach(() => {
  // Le cache est un état de MODULE, pas de requête : sans le vider, un test hériterait de
  // l'entrée laissée par le précédent, et ce serait un faux positif.
  viderCacheAcces();
});

describe("aAccesHub", () => {
  it("accorde quand le hub dit oui", async () => {
    const interroger = vi.fn(async () => true);
    expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(true);
    expect(interroger).toHaveBeenCalledWith(INVITEE, ENV.HUB_TOKEN);
  });

  it("refuse quand le hub dit non", async () => {
    const interroger = vi.fn(async () => false);
    expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(false);
  });

  it("normalise l'adresse — casse et espaces ne sont pas des différences", async () => {
    // Deux écritures de la même adresse seraient deux entrées de cache et, côté hub, deux
    // personnes : l'écart exact où une révocation ne révoque rien.
    const interroger = vi.fn(async () => true);
    await aAccesHub("  QuelquUn@Exemple.COM ", ENV, 0, interroger);
    expect(interroger).toHaveBeenCalledWith("quelquun@exemple.com", ENV.HUB_TOKEN);
  });

  it("refuse une adresse vide sans rien demander au hub", async () => {
    const interroger = vi.fn(async () => true);
    expect(await aAccesHub("", ENV, 0, interroger)).toBe(false);
    expect(await aAccesHub(null, ENV, 0, interroger)).toBe(false);
    expect(interroger).not.toHaveBeenCalled();
  });

  it("ÉCHEC FERMÉ : sans HUB_TOKEN, personne n'entre", async () => {
    const interroger = vi.fn(async () => true);
    expect(await aAccesHub(INVITEE, {}, 0, interroger)).toBe(false);
    expect(interroger).not.toHaveBeenCalled();
  });

  it("ÉCHEC FERMÉ : une panne réseau refuse, sans laisser fuiter l'exception", async () => {
    const erreur = vi.spyOn(console, "error").mockImplementation(() => {});
    const interroger = vi.fn(async () => {
      throw new Error("hub injoignable");
    });
    expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(false);
    expect(erreur).toHaveBeenCalledOnce();
    erreur.mockRestore();
  });

  describe("le cache d'une minute", () => {
    it("mémorise un OUI et ne redemande plus tant qu'il est valide", async () => {
      const interroger = vi.fn(async () => true);
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(true);
      // Juste avant l'expiration : le hub n'est PAS réinterrogé — même s'il répondrait
      // autre chose entre-temps, ce qui est justement ce qu'on vérifie.
      interroger.mockResolvedValue(false);
      expect(await aAccesHub(INVITEE, ENV, CACHE_ACCES_MS - 1, interroger)).toBe(true);
      expect(interroger).toHaveBeenCalledOnce();
    });

    it("redemande une fois le cache expiré — une révocation finit par mordre", async () => {
      const interroger = vi.fn(async () => true);
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(true);
      interroger.mockResolvedValue(false);
      expect(await aAccesHub(INVITEE, ENV, CACHE_ACCES_MS, interroger)).toBe(false);
      expect(interroger).toHaveBeenCalledTimes(2);
    });

    it("NE mémorise JAMAIS un refus — sinon quelqu'un qu'on vient d'ajouter attendrait", async () => {
      const interroger = vi.fn(async () => false);
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(false);
      // Même instant (0 ms écoulée) : si le refus avait été mis en cache, cette deuxième
      // demande serait COURT-CIRCUITÉE — le hub ne serait pas réinterrogé.
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(false);
      expect(interroger).toHaveBeenCalledTimes(2);

      // Et dès que le hub dit oui, l'accès est immédiat : rien ne devait rester en travers.
      interroger.mockResolvedValue(true);
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(true);
    });

    it("une révocation constatée efface l'entrée, pas seulement l'expiration", async () => {
      const interroger = vi.fn(async () => true);
      expect(await aAccesHub(INVITEE, ENV, 0, interroger)).toBe(true);
      interroger.mockResolvedValue(false);
      expect(await aAccesHub(INVITEE, ENV, CACHE_ACCES_MS, interroger)).toBe(false);
      // Un accès rendu juste après ne doit pas se heurter à une entrée fantôme du refus.
      interroger.mockResolvedValue(true);
      expect(await aAccesHub(INVITEE, ENV, CACHE_ACCES_MS, interroger)).toBe(true);
    });
  });
});
