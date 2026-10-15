// tests/forkIdentite.test.ts — verrouille l'étape 1 de la checklist de fork (CLAUDE.md § 11).
//
// Le piège : un fork qui garde `APP.id = "app-template"` publie un summary valide, le gate est
// vert, et rien ne dit que l'app n'est pas déclarée dans `lib/sources.ts` du hub. L'oubli
// ressemble ensuite à un bug d'autorisation (personne ne peut recevoir l'accès), pas à une
// étape sautée. Ce test rend l'oubli bruyant : il échoue tant que l'id est celui d'exemple.
//
// ── MÉCANISME D'EXEMPTION ────────────────────────────────────────────────────
// Le squelette lui-même DOIT garder l'id d'exemple, donc ce test ne peut pas échouer chez lui.
// L'exemption repose sur l'IDENTITÉ DU DÉPÔT, jamais sur un drapeau à retirer au fork : un
// drapeau serait une étape de plus à oublier, et on retomberait exactement dans le défaut
// qu'on corrige.
//   - En CI, `GITHUB_REPOSITORY` fait foi : exempté seulement s'il vaut `MoKarade/app-template`.
//   - Hors CI, le remote `origin` du dépôt local : exempté seulement s'il pointe sur ce même dépôt.
//   - Dépôt sans remote, ou autre dépôt (un fork, même renommé) : PAS exempté, le test s'applique.
// Échec fermé : dans le doute, le test s'applique.

import { execFileSync } from "node:child_process";
import { describe, it, expect } from "vitest";
import { HUB_TOKEN_HEADER } from "@mokarade/hub-contract";
import { GET } from "../app/hub/summary/route";

const DEPOT_SQUELETTE = "MoKarade/app-template";
const ID_EXEMPLE = "app-template";

/** Extrait `proprietaire/depot` d'une URL de remote (https ou ssh), sans `.git` ; `null` sinon. */
function depotDeRemote(url: string): string | null {
  const m = /github\.com[:/]+([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/i.exec(url.trim());
  return m?.[1] ?? null;
}

/** Pur : vrai seulement si on tourne dans le dépôt du squelette lui-même. */
function estLeSquelette(env: {
  githubRepository?: string;
  remoteOrigin?: string;
}): boolean {
  const depot = env.githubRepository
    ? env.githubRepository
    : env.remoteOrigin
      ? depotDeRemote(env.remoteOrigin)
      : null;
  return depot?.toLowerCase() === DEPOT_SQUELETTE.toLowerCase();
}

function remoteOriginLocal(): string | undefined {
  try {
    return execFileSync("git", ["config", "--get", "remote.origin.url"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined; // pas de git, pas de dépôt, pas de remote : on ne présume rien.
  }
}

/** Lit l'id publié par la VRAIE route : c'est ce que le hub verra, pas ce que dit le source. */
async function idPublie(): Promise<string> {
  const avant = process.env.HUB_TOKEN;
  const jeton = "jeton-de-test-fork-identite-0123456789";
  process.env.HUB_TOKEN = jeton;
  try {
    const res = await GET(
      new Request("https://exemple.hubperso.com/hub/summary", {
        headers: { [HUB_TOKEN_HEADER]: jeton },
      }),
    );
    expect(res.status).toBe(200);
    const corps = (await res.json()) as { app: { id: string } };
    return corps.app.id;
  } finally {
    if (avant === undefined) delete process.env.HUB_TOKEN;
    else process.env.HUB_TOKEN = avant;
  }
}

describe("estLeSquelette (mécanisme d'exemption)", () => {
  it("vrai en CI sur le dépôt du squelette, quelle que soit la casse", () => {
    expect(estLeSquelette({ githubRepository: "MoKarade/app-template" })).toBe(true);
    expect(estLeSquelette({ githubRepository: "mokarade/App-Template" })).toBe(true);
  });

  it("faux en CI sur un fork, même s'il s'appelle aussi app-template", () => {
    expect(estLeSquelette({ githubRepository: "MoKarade/mon-app" })).toBe(false);
    expect(estLeSquelette({ githubRepository: "autre/app-template" })).toBe(false);
  });

  it("GITHUB_REPOSITORY prime sur le remote local", () => {
    expect(
      estLeSquelette({
        githubRepository: "MoKarade/mon-app",
        remoteOrigin: "https://github.com/MoKarade/app-template",
      }),
    ).toBe(false);
  });

  it("hors CI, lit le remote origin (https, ssh, avec ou sans .git)", () => {
    for (const url of [
      "https://github.com/MoKarade/app-template",
      "https://github.com/MoKarade/app-template.git",
      "git@github.com:MoKarade/app-template.git",
      "https://x-access-token:abc@github.com/MoKarade/app-template.git",
    ]) {
      expect(estLeSquelette({ remoteOrigin: url })).toBe(true);
    }
  });

  it("échec fermé : remote d'un autre dépôt, illisible ou absent → pas le squelette", () => {
    expect(estLeSquelette({ remoteOrigin: "https://github.com/MoKarade/mon-app.git" })).toBe(false);
    expect(estLeSquelette({ remoteOrigin: "n'importe quoi" })).toBe(false);
    expect(estLeSquelette({})).toBe(false);
  });
});

describe("identité de l'app (checklist de fork, CLAUDE.md § 11, étape 1)", () => {
  it("APP.id n'est plus la valeur d'exemple, sauf dans le squelette lui-même", async () => {
    const squelette = estLeSquelette({
      githubRepository: process.env.GITHUB_REPOSITORY,
      remoteOrigin: process.env.GITHUB_REPOSITORY ? undefined : remoteOriginLocal(),
    });
    const id = await idPublie();

    if (squelette) {
      // Chez lui, le squelette garde l'id d'exemple : si ça change, l'exemption n'a plus d'objet.
      expect(id).toBe(ID_EXEMPLE);
      return;
    }

    expect(
      id,
      `APP.id vaut encore "${ID_EXEMPLE}" (app/hub/summary/route.ts). Un fork doit y mettre ` +
        `l'id de son app ET la déclarer dans lib/sources.ts du hub (+ HUB_TOKEN_<ID>) : sans ` +
        `cette déclaration, personne ne peut recevoir l'accès, et ça ressemble à un bug ` +
        `d'autorisation. Voir CLAUDE.md § 11, étapes 1 et 3.`,
    ).not.toBe(ID_EXEMPLE);
  });
});
