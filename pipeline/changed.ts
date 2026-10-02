// Welche Storys sollen gebaut werden? Aufruf: tsx pipeline/changed.ts <base-commit> [ids...]
// Gibt "ids=a b c" aus (für GITHUB_OUTPUT). Gebaut wird nur, was status "fertig" hat.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { loadStories } from "./load";

const [base, ...explicit] = process.argv.slice(2);
const stories = loadStories().filter((s) => s.data).map((s) => s.data!);
let ids: string[];

if (explicit.length) {
  ids = explicit;
} else {
  let files: string[] = [];
  try {
    files = execFileSync("git", ["diff", "--name-only", base, "HEAD"]).toString().split("\n").filter(Boolean);
  } catch {
    files = execFileSync("git", ["ls-files", "Videos", "Fakten"]).toString().split("\n").filter(Boolean);
  }
  const storyIds = files.filter((f) => f.startsWith("Videos/") && f.endsWith(".md")).map((f) => path.basename(f, ".md"));
  const factIds = new Set(files.filter((f) => f.startsWith("Fakten/") && f.endsWith(".md")).map((f) => path.basename(f, ".md")));
  ids = stories.filter((s) => storyIds.includes(s.id) || s.facts.some((f) => factIds.has(f))).map((s) => s.id);
}

const ready = ids.filter((id) => stories.find((s) => s.id === id)?.status === "fertig");
const skipped = ids.filter((id) => !ready.includes(id));
if (skipped.length) console.error(`Übersprungen (nicht 'fertig' oder unbekannt): ${skipped.join(", ")}`);
console.log(`ids=${ready.join(" ")}`);
