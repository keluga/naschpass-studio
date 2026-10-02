// Liest die Obsidian-Notizen (Markdown mit Frontmatter) aus Videos/ und Fakten/
// und wandelt sie in die internen Formate aus schema.ts um.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { Fact, FactSchema, Story, StorySchema } from "./schema";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const FACTS_DIR = path.join(ROOT, "Fakten");
export const STORIES_DIR = path.join(ROOT, "Videos");

type Loaded<T> = { file: string; data?: T; errors: string[] };

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export const readNote = (file: string) => {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(FM);
  if (!m) throw new Error("Frontmatter fehlt (Datei muss mit --- beginnen)");
  const fm = (YAML.parse(m[1]) ?? {}) as Record<string, unknown>;
  return { raw, fm, body: raw.slice(m[0].length) };
};

// Ersetzt oder ergänzt einfache Felder im Frontmatter, ohne den Rest umzuformatieren
export const setFields = (raw: string, fields: Record<string, string>) => {
  const m = raw.match(FM)!;
  let block = m[1];
  for (const [k, v] of Object.entries(fields)) {
    const line = `${k}: ${JSON.stringify(v)}`;
    const re = new RegExp(`^${k}:.*$`, "m");
    block = re.test(block) ? block.replace(re, line) : `${block}\n${line}`;
  }
  return raw.replace(m[1], block);
};

const str = (v: unknown) => (v === null || v === undefined ? undefined : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
const unlink = (v: unknown) => String(v).replace(/^\[\[|\]\]$/g, "").split("|")[0].trim();

// interne Feldnamen -> Namen in den Notizen (für verständliche Fehlermeldungen)
const RENAME: [RegExp, string][] = [
  [/^claim/, "aussage"], [/^source\.title/, "quelle"], [/^source\.url/, "url"], [/^source\.quote/, "zitat"],
  [/^checked/, "geprueft_am"], [/^note/, "notiz"], [/^template/, "vorlage"], [/^voice\.name/, "stimme"],
  [/^voice\.style/, "stil"], [/^facts/, "fakten"], [/^beats/, "szenen"], [/\.say/, ".sag"], [/\.show/, ".zeig"],
];
const german = (p: string) => RENAME.reduce((acc, [re, to]) => acc.replace(re, to), p);

const loadDir = <T>(dir: string, toInternal: (id: string, fm: Record<string, unknown>, body: string) => unknown, schema: typeof FactSchema | typeof StorySchema): Loaded<T>[] => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      try {
        const { fm, body } = readNote(file);
        const r = schema.safeParse(toInternal(path.basename(name, ".md"), fm, body));
        if (!r.success) return { file, errors: r.error.issues.map((i) => `${german(i.path.join(".")) || "(Datei)"}: ${i.message}`) };
        return { file, data: r.data as T, errors: [] };
      } catch (e) {
        return { file, errors: [(e as Error).message] };
      }
    });
};

const factFromNote = (id: string, fm: Record<string, unknown>) => ({
  id,
  claim: str(fm.aussage),
  source: { title: str(fm.quelle), url: str(fm.url), quote: str(fm.zitat) },
  status: str(fm.status),
  ...(fm.geprueft_am ? { checked: str(fm.geprueft_am) } : {}),
  ...(fm.notiz ? { note: str(fm.notiz) } : {}),
});

const SZENEN = /##\s*Szenen[\s\S]*?```yaml\r?\n([\s\S]*?)```/;

const storyFromNote = (id: string, fm: Record<string, unknown>, body: string) => {
  const m = body.match(SZENEN);
  if (!m) throw new Error("Abschnitt '## Szenen' mit ```yaml-Block fehlt");
  const szenen = (YAML.parse(m[1]) ?? []) as { sag?: unknown; zeig?: unknown }[];
  return {
    id,
    template: str(fm.vorlage),
    voice: { name: str(fm.stimme), style: str(fm.stil) },
    facts: Array.isArray(fm.fakten) ? fm.fakten.map(unlink) : [],
    beats: Array.isArray(szenen) ? szenen.map((s) => ({ say: str(s?.sag), show: s?.zeig })) : szenen,
    caption: str(fm.caption),
    hashtags: Array.isArray(fm.hashtags) ? fm.hashtags.map((h) => String(h).replace(/^#/, "")) : [],
    status: str(fm.status),
  };
};

export const loadFacts = () => loadDir<Fact>(FACTS_DIR, factFromNote, FactSchema);
export const loadStories = () => loadDir<Story>(STORIES_DIR, storyFromNote, StorySchema);

// Gesprochener Text ohne Regie-Tags wie <short pause>
export const spoken = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
export const wordCount = (s: string) => spoken(s).split(" ").filter(Boolean).length;

// Fehler zusätzlich als GitHub-Annotation ausgeben (lesbar über die API, ohne Log-Download)
export const ghError = (title: string, msg: string) => {
  if (process.env.GITHUB_ACTIONS) {
    const esc = (s: string) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    console.log(`::error title=${esc(title).replace(/[:,]/g, " ")}::${esc(msg)}`);
  }
};
