// Baut Videos: npm run produce -- 001-raider [002-...]   |   Probe ohne Netz: npm run mock -- 001-raider
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { beatStarts, timeWords } from "./align";
import { fetchImages } from "./images";
import { ghError, loadFacts, loadStories, ROOT } from "./load";
import { RenderProps, Story, Fact } from "./schema";
import { synthesize } from "./tts";
import { checkStory } from "./validate";

const args = process.argv.slice(2);
const mock = args.includes("--mock");
const ids = args.filter((a) => !a.startsWith("--"));
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "out");

const captionText = (story: Story, facts: Fact[], props: RenderProps) => {
  const lines = [story.caption.trim(), "", story.hashtags.map((h) => `#${h}`).join(" "), "", "Quellen:"];
  [...new Map(facts.map((f) => [f.source.url, f.source.title])).entries()].forEach(([url, title]) => lines.push(`- ${title}: ${url}`));
  const imgs = Object.values(props.images);
  if (imgs.length) {
    lines.push("", "Bilder:");
    imgs.forEach((i) => lines.push(`- ${i.credit}: ${i.pageUrl}`));
  }
  lines.push("", "Stimme: KI-generiert (Google Gemini).");
  return lines.join("\n") + "\n";
};

const main = async () => {
  if (!ids.length) throw new Error("Bitte Story-IDs angeben, z. B. npm run produce -- 001-raider");
  const facts = new Map(loadFacts().filter((f) => f.data).map((f) => [f.data!.id, f.data!]));
  const stories = loadStories();
  const jobs: { story: Story; props: RenderProps }[] = [];

  for (const id of ids) {
    const loaded = stories.find((s) => s.data?.id === id);
    if (!loaded?.data) throw new Error(`Story ${id} nicht gefunden oder fehlerhaft: ${loaded?.errors.join("; ") ?? ""}`);
    const story = loaded.data;
    const errors = [...loaded.errors, ...checkStory(story, facts, !mock)];
    if (errors.length) throw new Error(`Story ${id} ist nicht renderbereit:\n- ${errors.join("\n- ")}`);
    console.log(`▶ ${id}`);
    const dir = path.join(PUBLIC, "build", id);
    fs.rmSync(dir, { recursive: true, force: true });
    const wav = path.join(dir, "voice.wav");
    await synthesize(story, wav, mock);
    const { words, durationMs, matched } = await timeWords(story, wav, mock);
    if (!mock) console.log(`  Timing: ${matched} % der Wörter erkannt`);
    const images = await fetchImages(story, dir, mock);
    const rel = (p: string) => path.relative(PUBLIC, p).split(path.sep).join("/");
    const props: RenderProps = {
      story,
      audio: mock ? null : rel(wav),
      durationMs,
      beatStartsMs: beatStarts(words, story.beats.length),
      words,
      images: Object.fromEntries(Object.entries(images).map(([k, v]) => [k, { ...v, file: rel(v.file) }])),
    };
    jobs.push({ story, props });
    fs.mkdirSync(path.join(OUT, id), { recursive: true });
    fs.writeFileSync(path.join(OUT, id, "report.json"), JSON.stringify({ id, durationMs, timingMatchedPercent: matched, mock }, null, 2));
  }

  console.log("▶ Remotion-Bundle");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: PUBLIC });
  for (const { story, props } of jobs) {
    const composition = await selectComposition({ serveUrl, id: "Short", inputProps: props, browserExecutable: process.env.REMOTION_BROWSER || null });
    const mp4 = path.join(OUT, story.id, `${story.id}.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: mp4,
      inputProps: props,
      browserExecutable: process.env.REMOTION_BROWSER || null,
      concurrency: Number(process.env.RENDER_CONCURRENCY || 2),
    });
    const used = story.facts.map((f) => facts.get(f)!).filter(Boolean);
    fs.writeFileSync(path.join(OUT, story.id, "caption.txt"), captionText(story, used, props));
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", "fps=1/2,scale=270:-1,tile=8x1", "-frames:v", "1", path.join(OUT, story.id, "vorschau.jpg")]);
    console.log(`✓ ${story.id}: out/${story.id}/`);
  }
};

main().catch((e) => {
  ghError("Video-Pipeline", (e as Error).message);
  console.error(`\n✗ ${(e as Error).message}`);
  process.exit(1);
});
