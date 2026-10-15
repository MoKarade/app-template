// tests/sessionAsymetrique.test.ts — lecture du cookie de session SIGNÉ par le hub.
//
// Clés générées à la volée : aucune clé réelle dans le dépôt. On vérifie ce que la fonction
// rend (l'identité), pas seulement qu'elle ne lève pas.

import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT, exportJWK, generateKeyPair, type JWK, type CryptoKey } from "jose";
import { lireSessionHub, NOM_COOKIE_SESSION_HUB } from "../lib/sessionAsymetrique";

const KID = "test-1";
const MAINTENANT = new Date("2026-10-15T12:00:00Z");
const S = Math.floor(MAINTENANT.getTime() / 1000);

let privee: CryptoKey;
let jwks: { keys: JWK[] };
let env: Partial<NodeJS.ProcessEnv>;

async function signer(
  claims: Record<string, unknown>,
  cle: CryptoKey = privee,
  kid = KID,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "ES256", kid })
    .setIssuer("hubperso.com")
    .setIssuedAt(S)
    .setExpirationTime(S + 3600)
    .sign(cle);
}

beforeAll(async () => {
  const paire = await generateKeyPair("ES256");
  privee = paire.privateKey;
  jwks = { keys: [{ ...(await exportJWK(paire.publicKey)), kid: KID, alg: "ES256", use: "sig" }] };
  env = { HUB_SESSION_PUBLIC_KEYS: JSON.stringify(jwks) };
});

describe("lireSessionHub", () => {
  it("nomme le cookie posé par le hub", () => {
    expect(NOM_COOKIE_SESSION_HUB).toBe("__Secure-hub.session");
  });

  it("rend l'identité d'une session valide", async () => {
    const cookie = await signer({ email: "proprio@example.com" });
    const identite = await lireSessionHub(cookie, env, MAINTENANT);
    expect(identite?.email).toBe("proprio@example.com");
    expect(identite?.expireLe).toBe(S + 3600);
  });

  it("rend null sans cookie", async () => {
    expect(await lireSessionHub(undefined, env, MAINTENANT)).toBeNull();
    expect(await lireSessionHub("", env, MAINTENANT)).toBeNull();
  });

  it("rend null quand les clés publiques ne sont pas configurées", async () => {
    const cookie = await signer({ email: "proprio@example.com" });
    expect(await lireSessionHub(cookie, {}, MAINTENANT)).toBeNull();
    expect(await lireSessionHub(cookie, { HUB_SESSION_PUBLIC_KEYS: "  " }, MAINTENANT)).toBeNull();
  });

  it("rend null, sans lever, quand les clés publiques sont illisibles", async () => {
    const cookie = await signer({ email: "proprio@example.com" });
    expect(await lireSessionHub(cookie, { HUB_SESSION_PUBLIC_KEYS: "{pas du json" }, MAINTENANT)).toBeNull();
  });

  it("refuse une session signée par une AUTRE clé (fabriquée hors du hub)", async () => {
    const intrus = await generateKeyPair("ES256");
    const cookie = await signer({ email: "proprio@example.com" }, intrus.privateKey);
    expect(await lireSessionHub(cookie, env, MAINTENANT)).toBeNull();
  });

  it("refuse un kid inconnu : pas de repli sur « la seule clé »", async () => {
    const cookie = await signer({ email: "proprio@example.com" }, privee, "autre-kid");
    expect(await lireSessionHub(cookie, env, MAINTENANT)).toBeNull();
  });

  it("refuse une session expirée", async () => {
    const cookie = await signer({ email: "proprio@example.com" });
    const apres = new Date(MAINTENANT.getTime() + 2 * 3600 * 1000);
    expect(await lireSessionHub(cookie, env, apres)).toBeNull();
  });

  it("refuse une session sans adresse", async () => {
    const cookie = await signer({});
    expect(await lireSessionHub(cookie, env, MAINTENANT)).toBeNull();
  });

  it("refuse un cookie qui n'est pas un JWT", async () => {
    expect(await lireSessionHub("n'importe quoi", env, MAINTENANT)).toBeNull();
  });
});
