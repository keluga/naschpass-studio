import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ImageAsset, Show } from "../pipeline/schema";
import { AREA, BODY, HEAD, Palette } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type P = { show: Show; pal: Palette; images: Record<string, ImageAsset> };

// Bereich für das Motiv (oben), linksbündig
const Area: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center }) => (
  <AbsoluteFill
    style={{
      top: AREA.visualTop,
      height: AREA.visualBottom - AREA.visualTop,
      left: AREA.left,
      right: AREA.right,
      width: "auto",
      justifyContent: "center",
      alignItems: center ? "center" : "flex-start",
      flexDirection: "column",
      gap: 30,
    }}
  >
    {children}
  </AbsoluteFill>
);

const usePop = (delay = 0, damping = 10) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping } });
};

const fadeUp = (f: number, start: number) => ({
  opacity: interpolate(f, [start, start + 8], [0, 1], clamp),
  transform: `translateY(${interpolate(f, [start, start + 8], [30, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px)`,
});

const Label: React.FC<{ text: string; pal: Palette; start?: number }> = ({ text, pal, start = 10 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...fadeUp(f, start), fontFamily: HEAD, fontSize: 64, color: pal.bg, background: pal.accent2, padding: "8px 30px", borderRadius: 14, textTransform: "uppercase" }}>
      {text}
    </div>
  );
};

// Foto wie ein eingeklebtes Polaroid, langsamer Zoom (Ken Burns)
const Polaroid: React.FC<{ asset?: ImageAsset; tilt: number; width: number; delay?: number; pal: Palette }> = ({ asset, tilt, width, delay = 0, pal }) => {
  const f = useCurrentFrame();
  const s = usePop(delay, 13);
  const zoom = interpolate(f, [0, 150], [1, 1.1], clamp);
  return (
    <div
      style={{
        width,
        padding: 16,
        paddingBottom: 46,
        background: "#FBF8F1",
        borderRadius: 6,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        transform: `rotate(${tilt}deg) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
        opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
      }}
    >
      <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", background: pal.bg2 }}>
        {asset ? <Img src={staticFile(asset.file)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} /> : null}
      </div>
    </div>
  );
};

// Neutraler Riegel ohne Marke
const Bar: React.FC<{ delay: number }> = ({ delay }) => {
  const f = useCurrentFrame();
  const s = usePop(delay, 14);
  const finger = (
    <g>
      <rect x="0" y="0" width="560" height="120" rx="40" fill="#4A2612" />
      <rect x="18" y="16" width="524" height="40" rx="18" fill="#D98E32" />
      <rect x="18" y="62" width="524" height="40" rx="18" fill="#E8C07A" />
      <rect x="0" y="0" width="560" height="120" rx="40" fill="none" stroke="#2B140A" strokeWidth="6" />
    </g>
  );
  return (
    <svg width="760" height="350" viewBox="0 0 700 320" style={{ transform: `translateY(${interpolate(s, [0, 1], [400, 0])}px) rotate(${interpolate(s, [0, 1], [-18, -6])}deg)`, opacity: interpolate(f, [delay, delay + 6], [0, 1], clamp) }}>
      <g transform="translate(40,30)">{finger}</g>
      <g transform="translate(90,170)">{finger}</g>
    </svg>
  );
};

const YearRoll: React.FC<P & { show: Extract<Show, { type: "yearRoll" }> }> = ({ show, pal }) => {
  const f = useCurrentFrame();
  const year = Math.round(interpolate(f, [4, 40], [show.from, show.to], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const pop = interpolate(f, [40, 46, 54], [1, 1.1, 1], clamp);
  return (
    <Area>
      {show.label ? <div style={{ ...fadeUp(f, 0), fontFamily: HEAD, fontSize: 110, color: pal.text, textTransform: "uppercase", lineHeight: 1.05 }}>{show.label}</div> : null}
      <div style={{ fontFamily: HEAD, fontSize: 420, lineHeight: 1, color: pal.accent2, transform: `scale(${pop})`, transformOrigin: "left center" }}>{year}</div>
    </Area>
  );
};

const BigWord: React.FC<P & { show: Extract<Show, { type: "bigWord" }> }> = ({ show, pal }) => {
  const f = useCurrentFrame();
  const s = usePop(0, 9);
  const shake = f < 12 ? Math.sin(f * 2.4) * (12 - f) : 0;
  return (
    <Area>
      <div style={{ fontFamily: HEAD, fontSize: 300, lineHeight: 0.95, color: pal.accent, textTransform: "uppercase", transform: `scale(${interpolate(s, [0, 1], [2.3, 1])}) translateX(${shake}px)`, transformOrigin: "left center" }}>
        {show.word}
      </div>
      {show.bar ? <Bar delay={8} /> : null}
    </Area>
  );
};

const Swap: React.FC<P & { show: Extract<Show, { type: "swap" }> }> = ({ show, pal }) => {
  const f = useCurrentFrame();
  const strike = interpolate(f, [10, 22], [0, 100], clamp);
  const drop = interpolate(f, [26, 42], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const s = usePop(36, 10);
  const word: React.CSSProperties = { position: "absolute", fontFamily: HEAD, fontSize: 290, lineHeight: 1, textTransform: "uppercase" };
  return (
    <Area>
      {show.label ? <div style={{ ...fadeUp(f, 0), fontFamily: HEAD, fontSize: 150, color: pal.accent2 }}>{show.label}</div> : null}
      <div style={{ position: "relative", height: 320, width: "100%" }}>
        <div style={{ ...word, color: pal.text, opacity: 1 - drop, transform: `translateY(${drop * 420}px) rotate(${drop * 16}deg)` }}>
          {show.oldWord}
          <div style={{ position: "absolute", left: 0, top: "48%", height: 22, width: `${strike}%`, background: pal.accent, borderRadius: 11 }} />
        </div>
        <div style={{ ...word, color: pal.accent3, opacity: f >= 36 ? 1 : 0, transform: `scale(${interpolate(s, [0, 1], [0.3, 1])})`, transformOrigin: "left center" }}>{show.newWord}</div>
      </div>
    </Area>
  );
};

const Statement: React.FC<P & { show: Extract<Show, { type: "statement" }> }> = ({ show, pal }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Area>
      {show.lines.map((line, i) => {
        const s = spring({ frame: f - i * 14, fps, config: { damping: 12 } });
        return (
          <div key={line} style={{ fontFamily: HEAD, fontSize: 185, lineHeight: 1, textTransform: "uppercase", color: i === show.accent ? pal.accent : pal.text, opacity: interpolate(s, [0, 0.3], [0, 1], clamp), transform: `translateY(${interpolate(s, [0, 1], [120, 0])}px)` }}>
            {line}
          </div>
        );
      })}
    </Area>
  );
};

const Photo: React.FC<P & { show: Extract<Show, { type: "photo" }> }> = ({ show, pal, images }) => (
  <Area center>
    <Polaroid asset={images[show.image]} tilt={-3} width={760} pal={pal} />
    {show.label ? <Label text={show.label} pal={pal} /> : null}
  </Area>
);

const Stamp: React.FC<P & { show: Extract<Show, { type: "stamp" }> }> = ({ show, pal, images }) => {
  const f = useCurrentFrame();
  const s = usePop(12, 8);
  return (
    <Area center>
      <div style={{ position: "relative" }}>
        {show.image ? <Polaroid asset={images[show.image]} tilt={2} width={720} pal={pal} /> : <div style={{ width: 720, height: 520 }} />}
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            fontFamily: HEAD,
            fontSize: 170,
            color: pal.accent,
            border: `14px solid ${pal.accent}`,
            borderRadius: 24,
            padding: "0 36px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            background: "rgba(0,0,0,0.25)",
            opacity: f >= 12 ? 0.95 : 0,
            transform: `translate(-50%,-50%) rotate(-14deg) scale(${interpolate(s, [0, 1], [2.6, 1])})`,
          }}
        >
          {show.stamp}
        </div>
      </div>
      {show.label ? <Label text={show.label} pal={pal} start={20} /> : null}
    </Area>
  );
};

const Versus: React.FC<P & { show: Extract<Show, { type: "versus" }> }> = ({ show, pal, images }) => {
  const f = useCurrentFrame();
  const vs = usePop(14, 8);
  const side = (text: string, img: string | undefined, color: string, tilt: number, delay: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {img ? <Polaroid asset={images[img]} tilt={tilt} width={380} delay={delay} pal={pal} /> : null}
      <div style={{ ...fadeUp(f, delay + 6), fontFamily: HEAD, fontSize: 96, color: pal.bg, background: color, padding: "6px 30px", borderRadius: 999 }}>{text}</div>
    </div>
  );
  return (
    <Area center>
      <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
        {side(show.left, show.leftImage, pal.accent2, -4, 0)}
        <div style={{ fontFamily: HEAD, fontSize: 130, color: pal.text, transform: `scale(${interpolate(vs, [0, 1], [3, 1])})`, opacity: f >= 14 ? 1 : 0 }}>VS</div>
        {side(show.right, show.rightImage, pal.accent3, 4, 6)}
      </div>
    </Area>
  );
};

const Question: React.FC<P & { show: Extract<Show, { type: "question" }> }> = ({ show, pal }) => {
  const f = useCurrentFrame();
  const s = usePop(0, 9);
  const pill = (text: string, color: string, start: number) => (
    <div style={{ ...fadeUp(f, start), fontFamily: HEAD, fontSize: 84, color: pal.bg, background: color, padding: "12px 44px", borderRadius: 999, scale: String(1 + 0.04 * Math.sin((f - start) / 5)) }}>{text}</div>
  );
  return (
    <Area>
      <div style={{ fontFamily: HEAD, fontSize: 270, lineHeight: 1, color: pal.accent, textTransform: "uppercase", transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`, transformOrigin: "left center" }}>{show.word}</div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {pill(show.options[0], pal.accent2, 12)}
        <div style={{ ...fadeUp(f, 16), fontFamily: BODY, fontWeight: 800, fontSize: 48, color: pal.text }}>oder</div>
        {pill(show.options[1], pal.accent3, 20)}
      </div>
    </Area>
  );
};

export const Visual: React.FC<P> = (p) => {
  switch (p.show.type) {
    case "yearRoll":
      return <YearRoll {...p} show={p.show} />;
    case "bigWord":
      return <BigWord {...p} show={p.show} />;
    case "swap":
      return <Swap {...p} show={p.show} />;
    case "statement":
      return <Statement {...p} show={p.show} />;
    case "photo":
      return <Photo {...p} show={p.show} />;
    case "stamp":
      return <Stamp {...p} show={p.show} />;
    case "versus":
      return <Versus {...p} show={p.show} />;
    case "question":
      return <Question {...p} show={p.show} />;
  }
};
