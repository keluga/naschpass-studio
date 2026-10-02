import type { RenderProps } from "../pipeline/schema";

// Nur für die Vorschau in Remotion Studio (npm run studio). Echte Videos bekommen ihre Daten von pipeline/run.ts.
export const sample: RenderProps = {
  story: {
    id: "000-beispiel",
    template: "nostalgie",
    voice: { name: "Puck", style: "warm" },
    facts: ["beispiel"],
    beats: [
      { say: "Zurück ins Jahr 1991.", show: { type: "yearRoll", from: 2026, to: 1991, label: "Zurück ins Jahr" } },
      { say: "Damals hieß dieser Riegel noch Raider.", show: { type: "bigWord", word: "RAIDER", bar: true } },
      { say: "Sagst du heute noch Raider?", show: { type: "question", word: "RAIDER?", options: ["RAIDER", "TWIX"] } },
    ],
    caption: "Beispiel",
    hashtags: ["naschpass", "raider", "nostalgie"],
    status: "entwurf",
  },
  audio: null,
  durationMs: 6000,
  beatStartsMs: [0, 1800, 3800],
  words: "Zurück ins Jahr 1991. Damals hieß dieser Riegel noch Raider. Sagst du heute noch Raider?"
    .split(" ")
    .map((text, i) => ({ text, startMs: i * 400, endMs: i * 400 + 380, beat: i < 4 ? 0 : i < 10 ? 1 : 2 })),
  images: {},
};
