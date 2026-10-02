import React from "react";
import { Composition } from "remotion";
import type { RenderProps } from "../pipeline/schema";
import "./theme";
import { Short } from "./Short";
import { sample } from "./sample";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    fps={30}
    width={1080}
    height={1920}
    durationInFrames={30}
    defaultProps={sample}
    calculateMetadata={({ props }: { props: RenderProps }) => ({
      durationInFrames: Math.ceil((props.durationMs / 1000) * 30) + 24,
    })}
  />
);
