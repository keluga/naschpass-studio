import React, { useMemo } from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import type { RenderProps } from "../pipeline/schema";
import { AREA, BODY, HEAD, PALETTES, Palette } from "./theme";
import { Visual } from "./Visuals";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAGE_MS = 900; // wie lange eine Untertitel-Seite höchstens steht

const CaptionPage: React.FC<{ page: TikTokPage; pal: Palette }> = ({ page, pal }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = page.startMs + (f / fps) * 1000;
  return (
    <div
      style={{
        position: "absolute",
        top: AREA.captionTop,
        left: AREA.left,
        right: AREA.right,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px 24px",
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 72,
        lineHeight: 1.15,
        textAlign: "center",
        transform: `scale(${interpolate(f, [0, 4], [0.92, 1], clamp)})`,
      }}
    >
      {page.tokens.map((tok) => {
        const active = t >= tok.fromMs && t < tok.toMs;
        return (
          <span
            key={tok.fromMs}
            style={{
              color: active ? pal.accent2 : pal.text,
              WebkitTextStroke: "3px rgba(0,0,0,0.85)",
              paintOrder: "stroke fill",
              textShadow: "0 6px 18px rgba(0,0,0,0.55)",
              transform: active ? "scale(1.06)" : "none",
              transformOrigin: "center bottom",
              display: "inline-block",
            }}
          >
            {tok.text.trim()}
          </span>
        );
      })}
    </div>
  );
};

const Retro: React.FC<{ pal: Palette }> = ({ pal }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)", opacity: 0.5 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ background: pal.text, opacity: 0.015 + 0.01 * Math.abs(Math.sin(f * 1.7)) }} />
      <div style={{ position: "absolute", top: 160, left: AREA.left, fontFamily: BODY, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: pal.text, opacity: Math.floor(f / 15) % 2 === 0 ? 0.9 : 0.35 }}>▶ PLAY</div>
    </AbsoluteFill>
  );
};

const Sprinkles: React.FC<{ pal: Palette }> = ({ pal }) => {
  const f = useCurrentFrame();
  const items: [number, number, number, string][] = [
    [935, 520, 30, pal.accent], [965, 860, -20, pal.accent2], [915, 1100, 60, pal.accent3],
    [40, 1500, 15, pal.accent2], [985, 1460, -45, pal.accent], [30, 330, 70, pal.accent3],
  ];
  return (
    <AbsoluteFill>
      {items.map(([x, y, r, c], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y + Math.sin((f + i * 20) / 18) * 10, width: 58, height: 16, borderRadius: 8, background: c, opacity: 0.8, transform: `rotate(${r + f * 0.3}deg)` }} />
      ))}
    </AbsoluteFill>
  );
};

const Flash: React.FC<{ pal: Palette }> = ({ pal }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: pal.text, opacity: interpolate(f, [0, 4], [0.3, 0], clamp) }} />;
};

export const Short: React.FC<RenderProps> = ({ story, audio, durationMs, beatStartsMs, words, images }) => {
  const { fps } = useVideoConfig();
  const pal = PALETTES[story.template];
  const total = Math.ceil((durationMs / 1000) * fps) + Math.round(0.8 * fps);
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  const pages = useMemo(() => {
    const captions: Caption[] = words.map((w, i) => ({ text: (i === 0 ? "" : " ") + w.text, startMs: w.startMs, endMs: w.endMs, timestampMs: w.startMs, confidence: 1 }));
    return createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: PAGE_MS }).pages;
  }, [words]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${pal.bg2} 0%, ${pal.bg} 62%)` }}>
      <Sprinkles pal={pal} />
      {story.beats.map((beat, i) => {
        const from = toFrame(beatStartsMs[i]);
        const to = i + 1 < story.beats.length ? toFrame(beatStartsMs[i + 1]) : total;
        if (to <= from) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Visual show={beat.show} pal={pal} images={images} />
            {i > 0 ? <Flash pal={pal} /> : null}
          </Sequence>
        );
      })}
      {pages.map((page, i) => {
        const from = toFrame(page.startMs);
        const next = pages[i + 1];
        const end = Math.min(next ? toFrame(next.startMs) : total, from + toFrame(page.durationMs + 400));
        if (end <= from) return null;
        return (
          <Sequence key={`c${i}`} from={from} durationInFrames={end - from}>
            <CaptionPage page={page} pal={pal} />
          </Sequence>
        );
      })}
      {story.template === "nostalgie" ? <Retro pal={pal} /> : null}
      <div style={{ position: "absolute", top: 160, right: AREA.right, fontFamily: HEAD, fontSize: 40, letterSpacing: 2, color: pal.accent2 }}>NASCHPASS</div>
      {audio ? <Html5Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
