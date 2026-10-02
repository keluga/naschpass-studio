// Fotos von Wikimedia Commons: nur exakt benannte Dateien, nur CC0 / gemeinfrei / CC BY (ohne SA).
// Lizenz und Urheber kommen aus der Commons-API, nicht aus dem Skript, und landen im Bildnachweis.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ImageAsset, Story } from "./schema";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "NaschpassStudio/1.0 (https://github.com/keluga/naschpass-studio)";

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

export const allowedLicense = (code: string, short: string): boolean => {
  const c = code.toLowerCase();
  const s = short.toLowerCase();
  if (c.includes("sa") || s.includes("-sa") || s.includes(" sa")) return false;
  return c === "cc0" || c === "pd" || /^cc-by-\d/.test(c) || s === "cc0" || s.startsWith("public domain") || /^cc by \d/.test(s);
};

export const imagesOf = (story: Story): string[] => {
  const set = new Set<string>();
  for (const b of story.beats) {
    const s = b.show as Record<string, unknown>;
    for (const k of ["image", "leftImage", "rightImage"]) if (typeof s[k] === "string") set.add(s[k] as string);
  }
  return [...set];
};

export const fetchImages = async (story: Story, dir: string, mock: boolean): Promise<Record<string, ImageAsset>> => {
  const titles = imagesOf(story);
  const out: Record<string, ImageAsset> = {};
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, title] of titles.entries()) {
    const file = path.join(dir, `img${i}.jpg`);
    if (mock) {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=0x${["8a5a3c", "3c6e8a", "8a3c5e"][i % 3]}:s=1200x1200`, "-frames:v", "1", file]);
      out[title] = { title, file, credit: "Platzhalter (Probe)", license: "-", pageUrl: "-" };
      continue;
    }
    const url = `${API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&titles=${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Commons-API HTTP ${res.status} für ${title}`);
    const json = (await res.json()) as { query?: { pages?: { missing?: boolean; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }[] } };
    const page = json.query?.pages?.[0];
    const info = page?.imageinfo?.[0];
    if (!page || page.missing || !info) throw new Error(`Bild nicht gefunden auf Commons: ${title}`);
    const meta = info.extmetadata ?? {};
    const code = meta.License?.value ?? "";
    const short = meta.LicenseShortName?.value ?? "";
    if (!allowedLicense(code, short)) {
      throw new Error(`Lizenz nicht erlaubt für ${title}: "${short || code}". Erlaubt: CC0, gemeinfrei, CC BY (ohne SA).`);
    }
    const artist = stripHtml(meta.Artist?.value ?? "unbekannt");
    const img = await fetch(info.thumburl ?? info.url, { headers: { "User-Agent": UA } });
    if (!img.ok) throw new Error(`Bild-Download HTTP ${img.status} für ${title}`);
    const tmp = file + ".src";
    fs.writeFileSync(tmp, Buffer.from(await img.arrayBuffer()));
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-vf", "scale='min(1600,iw)':-2", "-q:v", "3", file]);
    fs.rmSync(tmp);
    out[title] = { title, file, credit: `${artist} (${short || code}), Wikimedia Commons`, license: short || code, pageUrl: info.descriptionurl };
    console.log(`  Bild ok: ${title} – ${short || code}`);
  }
  return out;
};
