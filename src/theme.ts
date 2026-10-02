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
