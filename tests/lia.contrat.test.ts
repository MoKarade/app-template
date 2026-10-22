// tests/lia.contrat.test.ts — le contrat entre l'app, le navigateur et le hub (pur).

import { describe, expect, it } from "vitest";
import { DemandeLia, QUESTION_MAX, ReponseLiaApp } from "../lib/lia/contrat";

describe("DemandeLia", () => {
  it("accepte une question, rognée, avec la page courante", () => {
    expect(DemandeLia.parse({ question: "  Quel est mon solde ?  ", page: "/budget" })).toEqual({
      question: "Quel est mon solde ?",
      page: "/budget",
    });
  });

  it.each([
    ["vide", { question: "   " }],
    ["trop longue", { question: "x".repeat(QUESTION_MAX + 1) }],
    ["page qui n'est pas un chemin", { question: "ok", page: "https://ailleurs.test/" }],
    ["absente", {}],
  ])("rejette une question %s", (_nom, corps) => {
    expect(DemandeLia.safeParse(corps).success).toBe(false);
  });
});

describe("ReponseLiaApp", () => {
  it("rend le texte, les puces et l'humeur, et STRIPPE les blocs et tout champ inconnu", () => {
    const lue = ReponseLiaApp.parse({
      text: "Voici.",
      chips: [{ id: "a", label: "Détails" }],
      mood: "curieux",
      blocks: [{ type: "carte", html: "<img src=x onerror=alert(1)>" }],
      secret: "x",
    });
    expect(lue).toEqual({ text: "Voici.", chips: [{ id: "a", label: "Détails" }], mood: "curieux" });
  });

  it.each([
    ["texte vide", { text: "" }],
    ["humeur inconnue", { text: "ok", mood: "furieux" }],
    ["trop de puces", { text: "ok", chips: Array.from({ length: 7 }, (_, i) => ({ id: `${i}`, label: "x" })) }],
    ["texte absent", { mood: "calme" }],
  ])("rejette une réponse avec %s", (_nom, corps) => {
    expect(ReponseLiaApp.safeParse(corps).success).toBe(false);
  });
});
