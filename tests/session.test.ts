// tests/session.test.ts — `requireSession` : session absente, utilisateur non autorisé,
// invité du hub, propriétaire. `@/auth` et `next/headers` sont remplacés : `auth.ts` tire
// `next/server`, dont la résolution casse sous Vitest ; la décision elle-même vit dans
// `lib/decisionAcces.ts` et se teste à part. Adresses fictives (example.com).

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  sessionAuthjs: null as { user?: { email?: string | null } } | null,
  signee: null as { email: string } | null,
  acces: vi.fn<(email: string | null | undefined) => Promise<boolean>>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (mocks.cookie ? { value: mocks.cookie } : undefined) }),
}));
vi.mock("@/auth", () => ({ auth: async () => mocks.sessionAuthjs }));
vi.mock("@/lib/sessionAsymetrique", () => ({
  NOM_COOKIE_SESSION_HUB: "__Secure-hub.session",
  lireSessionHub: async () => mocks.signee,
}));
vi.mock("@/lib/accesHub", () => ({ aAccesHub: mocks.acces }));

import { requireSession, NonAutorise } from "../lib/session";

const PROPRIETAIRE = "proprio@example.com";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("AUTH_SECRET", "secret-de-test");
  vi.stubEnv("AUTHORIZED_EMAIL", PROPRIETAIRE);
  mocks.cookie = undefined;
  mocks.sessionAuthjs = null;
  mocks.signee = null;
  mocks.acces.mockReset().mockResolvedValue(false);
});

describe("requireSession — échec fermé", () => {
  it("refuse tout quand l'auth n'est pas configurée, même avec une session valide", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    mocks.sessionAuthjs = { user: { email: PROPRIETAIRE } };
    await expect(requireSession()).rejects.toThrow(NonAutorise);
  });

  it("refuse une session absente", async () => {
    await expect(requireSession()).rejects.toThrow(NonAutorise);
    expect(mocks.acces).not.toHaveBeenCalled();
  });
});

describe("requireSession — session Auth.js", () => {
  it("admet le propriétaire sans interroger le hub", async () => {
    mocks.sessionAuthjs = { user: { email: PROPRIETAIRE } };
    expect(await requireSession()).toEqual({ email: PROPRIETAIRE });
    expect(mocks.acces).not.toHaveBeenCalled();
  });

  it("refuse une session d'un autre utilisateur non autorisé par le hub", async () => {
    mocks.sessionAuthjs = { user: { email: "autre@example.com" } };
    await expect(requireSession()).rejects.toThrow(NonAutorise);
    expect(mocks.acces).toHaveBeenCalledWith("autre@example.com");
  });

  it("admet un invité que le hub autorise", async () => {
    mocks.sessionAuthjs = { user: { email: "invite@example.com" } };
    mocks.acces.mockResolvedValue(true);
    expect(await requireSession()).toEqual({ email: "invite@example.com" });
  });
});

describe("requireSession — cookie signé par le hub", () => {
  beforeEach(() => {
    mocks.cookie = "cookie-signe";
  });

  it("admet le propriétaire", async () => {
    mocks.signee = { email: PROPRIETAIRE };
    expect(await requireSession()).toEqual({ email: PROPRIETAIRE });
    expect(mocks.acces).not.toHaveBeenCalled();
  });

  it("admet un invité que le hub autorise", async () => {
    mocks.signee = { email: "invite@example.com" };
    mocks.acces.mockResolvedValue(true);
    expect(await requireSession()).toEqual({ email: "invite@example.com" });
  });

  // Le refus est FINAL : une identité signée mais refusée ne doit pas rouvrir la porte par
  // la session Auth.js, sinon un cookie d'une autre app passerait par le second chemin.
  it("refuse un utilisateur non autorisé, même si une session Auth.js du propriétaire existe", async () => {
    mocks.signee = { email: "autre@example.com" };
    mocks.sessionAuthjs = { user: { email: PROPRIETAIRE } };
    await expect(requireSession()).rejects.toThrow(NonAutorise);
  });
});
