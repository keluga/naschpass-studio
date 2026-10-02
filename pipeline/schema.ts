// Datenformate für Fakten und Storys. Jede Änderung hier auch in CLAUDE.md nachziehen.
import { z } from "zod";

const shortText = (max: number) => z.string().trim().min(1).max(max);

export const FactSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id: nur a-z, 0-9 und Bindestriche"),
    claim: shortText(240), // die Aussage auf Deutsch, so wie sie im Video benutzt werden darf
    source: z.object({
      title: shortText(120),
      url: z.string().url().startsWith("https://"),
      quote: shortText(400), // wörtliches Zitat von der Quellseite, das die Aussage belegt
    }),
    status: z.enum(["entwurf", "geprueft", "abgelehnt"]),
    checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Prüfdatum (Pflicht bei geprueft)
    note: z.string().max(300).optional(), // Begründung bei abgelehnt
  })
  .strict()
  .superRefine((f, ctx) => {
    if (f.status === "geprueft" && !f.checked) {
      ctx.addIssue({ code: "custom", message: "status geprueft braucht ein Prüfdatum in 'checked'" });
    }
    if (f.status === "abgelehnt" && !f.note) {
      ctx.addIssue({ code: "custom", message: "status abgelehnt braucht eine Begründung in 'note'" });
    }
  });

const Upper = (max: number) => shortText(max);
const FileTitle = z.string().regex(/^File:.+\.(jpe?g|png|webp)$/i, "Bild: exakter Wikimedia-Dateiname 'File:….jpg|png'");

export const ShowSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("yearRoll"), from: z.number().int(), to: z.number().int(), label: Upper(28).optional() }).strict(),
  z.object({ type: z.literal("bigWord"), word: Upper(12), bar: z.boolean().optional() }).strict(),
  z.object({ type: z.literal("swap"), label: Upper(12).optional(), oldWord: Upper(12), newWord: Upper(12) }).strict(),
  z.object({ type: z.literal("statement"), lines: z.array(Upper(18)).min(1).max(3), accent: z.number().int().min(0).max(2).optional() }).strict(),
  z.object({ type: z.literal("photo"), image: FileTitle, label: Upper(24).optional() }).strict(),
  z.object({ type: z.literal("stamp"), image: FileTitle.optional(), stamp: Upper(12), label: Upper(24).optional() }).strict(),
  z.object({ type: z.literal("versus"), left: Upper(12), right: Upper(12), leftImage: FileTitle.optional(), rightImage: FileTitle.optional() }).strict(),
  z.object({ type: z.literal("question"), word: Upper(14), options: z.tuple([Upper(10), Upper(10)]) }).strict(),
]);

export const BeatSchema = z
  .object({
    say: shortText(200), // gesprochener Text (Deutsch). Darf <short pause> u. ä. enthalten.
    show: ShowSchema,
  })
  .strict();

export const StorySchema = z
  .object({
    id: z.string().regex(/^\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/, "id: z. B. 001-raider"),
    template: z.enum(["nostalgie", "verboten", "staunen", "duell"]),
    voice: z
      .object({
        name: z.string().regex(/^[A-Z][a-z]+$/), // Gemini-Stimme, z. B. Puck, Kore, Charon
        style: shortText(160), // Stimmung, z. B. "warm, begeistert, wie ein Freund"
      })
      .strict(),
    facts: z.array(z.string()).min(1),
    beats: z.array(BeatSchema).min(3).max(9),
    caption: shortText(300),
    hashtags: z.array(z.string().regex(/^[a-zäöüß0-9]+$/, "Hashtag ohne #, nur Kleinbuchstaben/Ziffern")).min(3).max(6),
    status: z.enum(["entwurf", "fertig", "gerendert", "gepostet"]),
  })
  .strict();

export type Fact = z.infer<typeof FactSchema>;
export type Story = z.infer<typeof StorySchema>;
export type Beat = z.infer<typeof BeatSchema>;
export type Show = z.infer<typeof ShowSchema>;

// Was der Renderer bekommt (berechnet von der Pipeline)
export type TimedWord = { text: string; startMs: number; endMs: number; beat: number };
export type ImageAsset = { title: string; file: string; credit: string; license: string; pageUrl: string };
export type RenderProps = {
  story: Story;
  audio: string | null; // Pfad relativ zu public/
  durationMs: number;
  beatStartsMs: number[];
  words: TimedWord[];
  images: Record<string, ImageAsset>; // key = File:-Titel
};
