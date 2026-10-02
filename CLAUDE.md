# Naschpass Studio – Regeln für Claude

Kurzvideos (TikTok/Reels, 1080×1920, 15–25 s) für @naschpass_de. Dieses Repo ist zugleich Kevs Obsidian-Vault. Kev managt alles im [[00 Cockpit]]. Gebaut wird automatisch in GitHub Actions (kostenlos), nicht hier.

## Harte Regeln
- **Kein Geld, keine Credits** ohne Kevs OK. Der `GEMINI_API_KEY` liegt nur als GitHub-Secret: nie lesen, ausgeben oder anfordern.
- **Fakten nur mit Beleg:** Jede Zahl, jedes Datum, jeder Name in einem Video muss in einem Fakt mit `status: geprueft` stehen. Unsicheres weglassen. Das Prüfskript blockiert Zahlen, die in keinem Fakt stehen.
- **Recht:** keine Gesundheitsaussagen, keine Kaufaufforderungen, keine Ansprache von Kindern, nichts Abwertendes über Marken. Zielgruppe: Erwachsene.
- **Bilder:** nur Wikimedia-Commons-Dateien unter CC0, gemeinfrei oder CC BY, ohne SA. Die Pipeline prüft die Lizenz selbst und bricht sonst ab. Keine KI-Bilder.
- **Keine Emojis im Video** (nur in `caption`).
- Pushen nach `main` ist hier kostenlos (kein Netlify). Code-Änderungen trotzdem über Branch + Pull Request, Inhalte (Notizen) direkt.

## Credits sparen (verbindlich)
- **Hauptsitzung für Routine auf Sonnet**, nicht Opus. Opus nur für Umbauten an Pipeline oder Vorlagen.
- **Nie lokal rendern.** Kein `npm run produce`, kein Remotion Studio. Bauen macht GitHub Actions. Lokal nur `npm run check`.
- Nur lesen, was die Aufgabe braucht. Für neue Videos reichen diese Datei, `Ideen.md`, die Agenten-Dateien und die vorhandenen Notizen in `Fakten/`. `src/` und `pipeline/` nur bei Fehlern öffnen.
- **Erst die Faktenbank durchsuchen** (`grep -ril <stichwort> Fakten/`), dann im Netz recherchieren. Ein geprüfter Fakt wird wiederverwendet, nie neu recherchiert.
- **Arbeit bündeln:** ein Agentenaufruf für alle Skripte eines Laufs, ein Aufruf für alle Prüfungen.
- Antworten an Kev kurz: was neu ist, was er tun muss, Links.

## Monatslauf: neue Videos
1. `Ideen.md` lesen und die nächsten **N** offenen Ideen nehmen (Standard N = 8). Saisonales vorziehen (Halloween vor dem 31.10., Advent vor dem 1.12.).
2. Agent **skript-autor** einmal aufrufen, mit allen N Ideen und den nächsten freien Nummern (höchste Nummer in `Videos/` + 1 …).
3. Agent **fakten-pruefer** einmal aufrufen, mit der Liste aller neuen Fakten (`status: entwurf`).
4. `npm run check`. Fehler selbst beheben, wenn es reine Formfehler sind. Inhaltliche Fehler gehen an den skript-autor zurück.
5. Videos, deren Fakten alle `geprueft` sind, bleiben auf `status: entwurf`, denn freigeben tut Kev. Videos mit abgelehnten Fakten: Szene umschreiben oder streichen, damit nur geprüfte Fakten übrig bleiben.
6. In `Ideen.md` die erledigten Ideen mit ✅ und `[[id]]` markieren.
7. Committen und nach `main` pushen (`Neue Videos: …`). Kev kurz Bescheid geben: welche Videos, Hinweis „im Cockpit freigeben“.

## Formate
**Fakt** `Fakten/<id>.md`, id = Dateiname (`kleinbuchstaben-mit-bindestrich`):
```yaml
---
aussage: "Deutscher Satz, genau so belegt, wie er im Video benutzt wird."
quelle: "Wikipedia (englisch): Twix"
url: "https://…"
zitat: "Wörtliches Zitat von der Seite, das die Aussage belegt."
status: entwurf        # entwurf | geprueft | abgelehnt (nur der fakten-pruefer setzt geprueft/abgelehnt)
geprueft_am: ""
notiz: ""
---
```
**Video** `Videos/<nnn-stichwort>.md`. Vorbild ist `Videos/001-raider.md`, Aufbau genau so übernehmen: Frontmatter (`status, vorlage, stimme, stil, fakten, caption, hashtags, video, gerendert_am, gepostet_am`), danach `## Szenen` mit genau einem ```yaml-Block (Liste aus `sag` + `zeig`), danach `## Notizen`.

**Szenen-Typen (`zeig`)**, Texte kurz halten, Großschreibung macht die Vorlage:
| type | Felder | wofür |
| --- | --- | --- |
| `yearRoll` | `from` (aktuelles Jahr), `to` (Jahr aus Fakt), `label?` | Zeitreise-Einstieg |
| `bigWord` | `word` (≤12), `bar?` | ein Name knallt rein |
| `swap` | `label?`, `oldWord`, `newWord` | Umbenennung |
| `statement` | `lines` (1–3 × ≤18 Zeichen), `accent?` (Index) | Kernaussage |
| `photo` | `image` (`File:….jpg`), `label?` | Foto als Polaroid |
| `stamp` | `stamp` (≤12, z. B. VERBOTEN), `image?`, `label?` | Verbote |
| `versus` | `left`, `right`, `leftImage?`, `rightImage?` | Duelle |
| `question` | `word` (≤14), `options` [2 × ≤10] | Schluss mit Kommentar-Frage |

**Vorlagen (`vorlage`):** `nostalgie` (VHS-Look), `verboten` (dunkelrot, Stempel), `staunen` (türkis), `duell` (grün, VS).
**Stimme (`stimme`):** fest `Puck`, bis Kev nach dem Stimmen-Casting eine andere wählt.

## Befehle
- `npm run check`: prüft alle Notizen. `npm run check -- --ready <id>`: prüft, ob ein Video baubar ist.
- GitHub Actions: „Videos bauen“ (automatisch bei Push oder per Hand mit IDs), „Stimmen-Casting“ (per Hand).
