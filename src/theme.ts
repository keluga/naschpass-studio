import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({ family: "Anton", url: staticFile("fonts/Anton-Regular.ttf") });
loadFont({ family: "Inter", url: staticFile("fonts/Inter.ttf"), weight: "100 900" });

export const HEAD = "Anton, Impact, sans-serif";
export const BODY = "Inter, Arial, sans-serif";

export type Palette = { bg: string; bg2: string; text: string; accent: string; accent2: string; accent3: string };

// Farbwelten je Vorlage (Markenfarben bleiben erkennbar)
export const PALETTES: Record<string, Palette> = {
  nostalgie: { bg: "#1B1036", bg2: "#2C1A57", text: "#FFF7EC", accent: "#FF4D8D", accent2: "#FFD23F", accent3: "#3DDC97" },
  verboten: { bg: "#160A0E", bg2: "#3A0F1F", text: "#FFF4EE", accent: "#FF3B3B", accent2: "#FFD23F", accent3: "#FF7AA8" },
  staunen: { bg: "#0F2A3F", bg2: "#164A63", text: "#F2FBFF", accent: "#3DDC97", accent2: "#FFD23F", accent3: "#FF4D8D" },
  duell: { bg: "#10302A", bg2: "#1B4A40", text: "#F4FFF9", accent: "#FFD23F", accent2: "#FF6B6B", accent3: "#3DDC97" },
};

// Bildaufteilung 1080x1920: oben Motiv, darunter Untertitel, unten frei für TikTok/Reels-Bedienelemente
export const AREA = { left: 90, right: 150, visualTop: 250, visualBottom: 1150, captionTop: 1190 };

// Zeichenbreiten von Anton (Anteil der Schriftgröße, aus der Fontdatei gemessen).
// Damit passen lange Wörter automatisch in die Breite, statt rechts abgeschnitten zu werden.
const ANTON_W: Record<string, number> = {
  A: 0.485, B: 0.479, C: 0.474, D: 0.493, E: 0.412, F: 0.399, G: 0.485, H: 0.499, I: 0.227, J: 0.466, K: 0.472, L: 0.397, M: 0.746,
  N: 0.498, O: 0.486, P: 0.472, Q: 0.494, R: 0.477, S: 0.461, T: 0.396, U: 0.474, V: 0.469, W: 0.712, X: 0.484, Y: 0.446, Z: 0.41,
  Ä: 0.485, Ö: 0.486, Ü: 0.474, ẞ: 0.498, "1": 0.331, " ": 0.234, ".": 0.229, ",": 0.236, ":": 0.242, ";": 0.245, "!": 0.229,
  "?": 0.492, "-": 0.311, "–": 0.311, "'": 0.214, '"': 0.429, "„": 0.467, "“": 0.464, "%": 1.057, "&": 0.52, "/": 0.405,
  "(": 0.291, ")": 0.291, "+": 0.355, "#": 0.546,
};
export const AREA_WIDTH = 1080 - AREA.left - AREA.right;
const emWidth = (text: string) => [...text.toUpperCase().replace(/ß/g, "SS")].reduce((sum, c) => sum + (ANTON_W[c] ?? 0.5), 0);
// Größte Schriftgröße bis `base`, bei der `text` (Großbuchstaben, Anton) in `max` Pixel passt (5 % Reserve)
export const fitSize = (text: string, base: number, max = AREA_WIDTH) => Math.floor(Math.min(base, (max * 0.95) / Math.max(emWidth(text), 0.01)));
