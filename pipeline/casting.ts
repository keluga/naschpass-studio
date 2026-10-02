// Erzeugt Hörproben für mehrere Gemini-Stimmen nach out/casting/<Stimme>.mp3.
// Aufruf: tsx pipeline/casting.ts  (braucht GEMINI_API_KEY und ffmpeg)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./load";
import type { Story } from "./schema";
import { synthesize } from "./tts";
import { ghError } from "./load";

const VOICES = ["Puck", "Kore", "Charon", "Aoede", "Fenrir", "Leda", "Orus", "Zephyr"];
const TEXT = "Zurück ins Jahr 1991. Damals verschwand ein Name, den du vielleicht noch kennst: Raider. Sagst du heute noch Raider? Schreib's in die Kommentare.";
const STYLE = "warm und begeistert, wie ein Freund, der eine Kindheitserinnerung erzählt";
const PAUSE_MS = 7000; // Rate-Limit der Gemini-API

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dir = path.join(ROOT, "out", "casting");
fs.mkdirSync(dir, { recursive: true });

const storyFor = (voice: string) =>
  ({
    id: "000-casting",
    template: "nostalgie",
    voice: { name: voice, style: STYLE },
    facts: ["casting"],
    beats: [{ say: TEXT, show: { type: "bigWord", word: "RAIDER" } }],
    caption: "Stimmen-Casting",
    hashtags: ["naschpass", "casting", "stimmen"],
    status: "entwurf",
  }) as Story;

const ok: string[] = [];
const failed: { voice: string; reason: string }[] = [];

for (const [i, voice] of VOICES.entries()) {
  if (i > 0) await sleep(PAUSE_MS);
  const wav = path.join(dir, `${voice}.wav`);
  const mp3 = path.join(dir, `${voice}.mp3`);
  console.log(`Stimme ${voice} (${i + 1}/${VOICES.length})`);
  try {
    await synthesize(storyFor(voice), wav, false);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", mp3]);
    ok.push(voice);
  } catch (e) {
    const reason = ((e as Error).message || String(e)).split("\n")[0].slice(0, 300);
    console.error(`  Fehler bei ${voice}: ${reason}`);
    ghError(`Casting ${voice}`, reason);
    failed.push({ voice, reason });
  }
}

console.log(`\nok: ${ok.join(", ") || "keine"}`);
console.log(`fehlgeschlagen: ${failed.map((f) => `${f.voice} (${f.reason})`).join("; ") || "keine"}`);
if (ok.length === 0) process.exit(1);
