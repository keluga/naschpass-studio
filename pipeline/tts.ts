// Sprecherstimme über Gemini TTS (kostenlose Stufe). Ergebnis wird per Hash zwischengespeichert,
// damit ein erneuter Render derselben Story kein Kontingent verbraucht.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, wordCount } from "./load";
import { Story } from "./schema";

const CACHE = path.join(ROOT, ".cache", "tts");
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODELS = [process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];

export const narration = (story: Story) => story.beats.map((b) => b.say.trim()).join(" ");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toWav = (buf: Buffer, out: string) => {
  if (buf.subarray(0, 4).toString() === "RIFF") {
    fs.writeFileSync(out, buf);
    return;
  }
  // rohes PCM (16 bit, 24 kHz, mono) in WAV verpacken
  const raw = out + ".pcm";
  fs.writeFileSync(raw, buf);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, out]);
  fs.rmSync(raw);
};

const findAudio = (json: unknown): string | null => {
  // Antwort: steps[].content[] mit type "audio" und base64 in data (laut Google-Doku)
  const steps = (json as { steps?: { type?: string; content?: { type?: string; data?: string }[] }[] }).steps ?? [];
  const parts = steps.flatMap((s) => s.content ?? []).filter((c) => c.type === "audio" && c.data);
  return parts.length ? parts[parts.length - 1].data! : null;
};

const request = async (model: string, story: Story, key: string) => {
  const body = {
    model,
    input: [
      {
        type: "user_input",
        content: [
          {
            type: "text",
            text: narration(story),
            annotations: [{ type: "speech_metadata", style: `${story.voice.style}. Sprich Deutsch.` }],
          },
        ],
      },
    ],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice: story.voice.name }] },
  };
  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

export const synthesize = async (story: Story, outWav: string, mock: boolean): Promise<void> => {
  fs.mkdirSync(path.dirname(outWav), { recursive: true });
  if (mock) {
    // Probe-Modus ohne Netz: Stille in geschätzter Länge (2,6 Wörter pro Sekunde)
    const secs = story.beats.reduce((n, b) => n + wordCount(b.say), 0) / 2.6 + 0.5;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", secs.toFixed(2), outWav]);
    return;
  }
  const hash = crypto.createHash("sha256").update(JSON.stringify([narration(story), story.voice, MODELS[0]])).digest("hex").slice(0, 16);
  const cached = path.join(CACHE, `${hash}.wav`);
  if (fs.existsSync(cached)) {
    fs.copyFileSync(cached, outWav);
    console.log(`  Stimme aus Zwischenspeicher (${hash})`);
    return;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY fehlt (GitHub: Settings → Secrets and variables → Actions)");

  let lastError = "";
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await request(model, story, key);
      const text = await res.text();
      if (res.ok) {
        const data = findAudio(JSON.parse(text));
        if (!data) throw new Error(`Gemini-Antwort ohne Audio: ${text.slice(0, 300)}`);
        toWav(Buffer.from(data, "base64"), outWav);
        fs.mkdirSync(CACHE, { recursive: true });
        fs.copyFileSync(outWav, cached);
        console.log(`  Stimme erzeugt mit ${model} (${story.voice.name})`);
        return;
      }
      lastError = `${model}: HTTP ${res.status} ${text.slice(0, 300)}`;
      if (res.status === 404 || res.status === 400) break; // Modell gibt es nicht oder Anfrage falsch: nächstes Modell
      if (res.status === 429 && attempt === 3) break;
      if (res.status === 429 || res.status >= 500) await sleep(20000 * attempt);
      else break;
    }
  }
  throw new Error(`Gemini TTS fehlgeschlagen. ${lastError}\nBei HTTP 429: Tageslimit erreicht, morgen erneut starten.`);
};
