// Prüft alle Notizen in Fakten/ und Videos/. Aufruf: npm run check  [-- --ready <video-id> ...]
// --ready: die genannten Storys müssen renderbereit sein (status fertig, alle Fakten geprueft).
import path from "node:path";
import { loadFacts, loadStories, spoken, wordCount } from "./load";
import { Story, Fact } from "./schema";

const MAX_WORDS = 75; // ca. 25 Sekunden Sprechzeit
const HEALTH = /\b(gesund\w*|zuckerfrei|weniger zucker|abnehm\w*|vitamin\w*|kalorienarm|schlank\w*|heilt|immunsystem)\b/i;
const BUY = /\b(jetzt kaufen|kauf (es|sie|dir)|bestell(e|t)? (jetzt|dir)|nur heute|schnell zugreifen)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;

const showTexts = (story: Story): string[] =>
  story.beats.flatMap((b) => {
    const s = b.show as Record<string, unknown>;
    return Object.entries(s)
      .filter(([k]) => !["type", "image", "leftImage", "rightImage", "from", "to", "bar", "accent"].includes(k))
      .flatMap(([, v]) => (Array.isArray(v) ? v : [v]))
      .filter((v): v is string => typeof v === "string");
  });

export const checkStory = (story: Story, facts: Map<string, Fact>, ready: boolean): string[] => {
  const err: string[] = [];
  const used = story.facts.map((id) => facts.get(id));
  story.facts.forEach((id, i) => {
    if (!used[i]) err.push(`fakten: Fakt '${id}' gibt es nicht im Ordner Fakten/`);
    else if (used[i]!.status === "abgelehnt") err.push(`fakten: Fakt '${id}' ist abgelehnt und darf nicht benutzt werden`);
    else if (ready && used[i]!.status !== "geprueft") err.push(`fakten: Fakt '${id}' ist noch nicht geprüft`);
  });
  if (ready && !['fertig', 'gerendert'].includes(story.status)) err.push(`status: ist '${story.status}', zum Bauen muss es 'fertig' sein`);

  const words = story.beats.reduce((n, b) => n + wordCount(b.say), 0);
  if (words > MAX_WORDS) err.push(`szenen: ${words} gesprochene Wörter, erlaubt sind höchstens ${MAX_WORDS}`);

  // Jede Zahl in Sprechtext und Bildtext muss in einem benutzten Fakt stehen (Schutz vor erfundenen Zahlen)
  const claims = used.filter(Boolean).map((f) => f!.claim).join(" ");
  const thisYear = new Date().getFullYear();
  const texts = [...story.beats.map((b) => spoken(b.say)), ...showTexts(story), story.caption];
  for (const t of texts) {
    for (const num of t.match(/\d+(?:[.,]\d+)*/g) ?? []) {
      if (!new RegExp(`(^|[^\\d])${num.replace(/[.,]/g, "[.,]")}([^\\d]|$)`).test(claims)) {
        err.push(`Zahl '${num}' in "${t}" steht in keinem benutzten Fakt`);
      }
    }
  }
  story.beats.forEach((b, i) => {
    if (b.show.type === "yearRoll") {
      if (b.show.from !== thisYear && !claims.includes(String(b.show.from))) err.push(`szenen.${i}.zeig.from: nur aktuelles Jahr oder Jahr aus einem Fakt`);
      if (!claims.includes(String(b.show.to))) err.push(`szenen.${i}.zeig.to: Jahr ${b.show.to} steht in keinem Fakt`);
    }
  });

  const all = texts.join(" \n ");
  if (HEALTH.test(all)) err.push(`Gesundheitsaussage gefunden ("${all.match(HEALTH)![0]}"): verboten (HCVO)`);
  if (BUY.test(all)) err.push(`Kaufaufforderung gefunden ("${all.match(BUY)![0]}"): verboten`);
  if (texts.slice(0, -1).some((t) => EMOJI.test(t))) err.push("Emojis nur in der Caption, nicht im Video");
  if (!story.hashtags.includes("naschpass")) err.push("hashtags: 'naschpass' fehlt");
  return err;
};

const main = () => {
  const args = process.argv.slice(2);
  const ready = args.includes("--ready");
  const only = args.filter((a) => !a.startsWith("--"));
  const factFiles = loadFacts();
  const storyFiles = loadStories();
  const facts = new Map(factFiles.filter((f) => f.data).map((f) => [f.data!.id, f.data!]));
  let problems = 0;
  const report = (file: string, errors: string[]) => {
    if (!errors.length) return;
    problems += errors.length;
    console.log(`\n✗ ${path.relative(process.cwd(), file)}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  };
  factFiles.forEach((f) => report(f.file, f.errors));
  for (const s of storyFiles) {
    if (only.length && (!s.data || !only.includes(s.data.id))) continue;
    report(s.file, [...s.errors, ...(s.data ? checkStory(s.data, facts, ready && only.includes(s.data.id)) : [])]);
  }
  if (only.length) {
    const missing = only.filter((id) => !storyFiles.some((s) => s.data?.id === id));
    report("stories", missing.map((id) => `Story '${id}' nicht gefunden`));
  }
  const nFacts = factFiles.length;
  const nStories = storyFiles.length;
  console.log(problems ? `\n${problems} Problem(e) gefunden.` : `✓ alles ok (${nFacts} Fakten, ${nStories} Storys)`);
  process.exit(problems ? 1 : 0);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
