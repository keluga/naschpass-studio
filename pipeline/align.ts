// Wortgenaue Zeiten: whisper.cpp hört die Stimme ab, danach werden die erkannten Wörter
// den Wörtern aus dem Skript zugeordnet. Angezeigt wird immer der Skript-Text (richtige Schreibweise).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import { ROOT, spoken } from "./load";
import { Story, TimedWord } from "./schema";

const WHISPER_DIR = path.join(ROOT, ".cache", "whisper.cpp");
const WHISPER_VERSION = "1.5.5";
const MODEL = "small" as const; // mehrsprachig, gut genug für deutsches Timing

export const audioDurationMs = (wav: string): number => {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString();
  return Math.round(parseFloat(out) * 1000);
};

const norm = (w: string) =>
  w
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");

const lev = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

const similar = (a: string, b: string) => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return Math.max(a.length, b.length) >= 5 && lev(a, b) <= 1;
};

// Skript-Wörter mit Beat-Nummer
export const scriptWords = (story: Story) =>
  story.beats.flatMap((b, beat) => spoken(b.say).split(" ").filter(Boolean).map((text) => ({ text, beat })));

// Ordnet erkannte Wörter (mit Zeit) den Skript-Wörtern zu; Lücken werden gleichmäßig aufgefüllt.
export const alignWords = (script: { text: string; beat: number }[], heard: { text: string; startMs: number; endMs: number }[], totalMs: number): { words: TimedWord[]; matched: number } => {
  const h = heard.map((w) => ({ ...w, n: norm(w.text) })).filter((w) => w.n);
  const times: ({ startMs: number; endMs: number } | null)[] = script.map(() => null);
  let j = 0;
  script.forEach((w, i) => {
    const n = norm(w.text);
    for (let k = j; k < Math.min(j + 5, h.length); k++) {
      if (similar(n, h[k].n)) {
        times[i] = { startMs: h[k].startMs, endMs: h[k].endMs };
        j = k + 1;
        return;
      }
    }
  });
  // Lücken: zwischen bekannten Nachbarn nach Zeichenzahl verteilen
  const out: TimedWord[] = [];
  let i = 0;
  while (i < script.length) {
    if (times[i]) {
      out.push({ ...script[i], ...times[i]! });
      i++;
      continue;
    }
    let k = i;
    while (k < script.length && !times[k]) k++;
    const from = i === 0 ? 0 : out[out.length - 1].endMs;
    const to = k < script.length ? times[k]!.startMs : totalMs;
    const chars = script.slice(i, k).reduce((n, w) => n + w.text.length + 1, 0);
    let t = from;
    for (let m = i; m < k; m++) {
      const d = ((to - from) * (script[m].text.length + 1)) / chars;
      out.push({ ...script[m], startMs: Math.round(t), endMs: Math.round(t + d) });
      t += d;
    }
    i = k;
  }
  return { words: out, matched: times.filter(Boolean).length };
};

export const timeWords = async (story: Story, wav: string, mock: boolean): Promise<{ words: TimedWord[]; durationMs: number; matched: number }> => {
  const durationMs = audioDurationMs(wav);
  const script = scriptWords(story);
  if (mock) return { ...alignWords(script, [], durationMs), durationMs };

  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: false });
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_DIR, printOutput: false });
  const wav16 = wav.replace(/\.wav$/, ".16k.wav");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-ar", "16000", "-ac", "1", wav16]);
  const whisperCppOutput = await transcribe({
    inputPath: wav16,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: MODEL,
    tokenLevelTimestamps: true,
    language: "de",
    splitOnWord: true,
    printOutput: false,
  });
  fs.rmSync(wav16);
  const { captions } = toCaptions({ whisperCppOutput });
  const heard = captions.map((c) => ({ text: c.text.trim(), startMs: c.startMs, endMs: c.endMs }));
  const { words, matched } = alignWords(script, heard, durationMs);
  return { words, durationMs, matched: Math.round((100 * matched) / script.length) };
};

export const beatStarts = (words: TimedWord[], beats: number): number[] =>
  Array.from({ length: beats }, (_, b) => (b === 0 ? 0 : words.find((w) => w.beat === b)?.startMs ?? 0));
