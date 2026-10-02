// Schreibt nach dem Bauen Status, Video-Link und Datum zurück in die Notiz Videos/<id>.md.
// Aufruf: tsx pipeline/writeback.ts <id> <videoUrl>
import fs from "node:fs";
import path from "node:path";
import { STORIES_DIR, setFields } from "./load";

const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

const [id, videoUrl] = process.argv.slice(2);
if (!id || !videoUrl) fail("Aufruf: tsx pipeline/writeback.ts <id> <videoUrl>  (z. B. 001-raider https://github.com/…)");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`Ungültige Video-ID: "${id}" (erlaubt: a-z, 0-9, Bindestriche)`);

const file = path.join(STORIES_DIR, `${id}.md`);
if (!fs.existsSync(file)) fail(`Notiz nicht gefunden: ${file}`);

const raw = fs.readFileSync(file, "utf8");
if (!/^---\r?\n[\s\S]*?\r?\n---/.test(raw)) fail(`Frontmatter fehlt in ${file} (Datei muss mit --- beginnen)`);

const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
fs.writeFileSync(file, setFields(raw, { status: "gerendert", video: videoUrl, gerendert_am: today }));
console.log(`${id}: status=gerendert, video=${videoUrl}, gerendert_am=${today}`);
