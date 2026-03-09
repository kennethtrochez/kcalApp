import React from "react";
import Svg, { Defs, ClipPath, Path, Rect } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  progress: number; // 0..1
};

export default function SilhouetteProgress({
  width = 220,
  height = 360,
  progress,
}: Props) {
  const p = Math.max(0, Math.min(1, progress));

  // Fill rises from bottom. We draw a rect and clip it to the silhouette.
  const fillHeight = height * p;
  const fillY = height - fillHeight;

  // Stylized human silhouette path, centered in the viewBox
  const silhouettePath =
    "M110 22c-18 0-33 15-33 33 0 14 9 26 21 31-7 6-12 15-13 26l-2 30c-1 13-9 24-20 29-6 3-10 9-10 16v18c0 8 6 14 14 14h22c8 0 14-6 14-14v-28c0-7 6-13 13-13h0c7 0 13 6 13 13v28c0 8 6 14 14 14h22c8 0 14-6 14-14v-18c0-7-4-13-10-16-11-5-19-16-20-29l-2-30c-1-11-6-20-13-26 12-5 21-17 21-31 0-18-15-33-33-33Zm-37 192h23v-25c0-14 11-25 25-25s25 11 25 25v25h23v-10c0-3-2-6-5-7-17-8-28-25-30-44l-2-30c-1-13-8-24-18-30h-1c-10 6-17 17-18 30l-2 30c-2 19-13 36-30 44-3 1-5 4-5 7v10Zm37-162c0 0 0 0 0 0 9 0 16-7 16-16s-7-16-16-16-16 7-16 16 7 16 16 16Z";

  return (
    <Svg width={width} height={height} viewBox="0 0 220 360">
      <Defs>
        <ClipPath id="silhouetteClip">
        {/* Head */}
        <Path d="M110 46a22 22 0 1 0 0.001 0Z" />
        {/* Body (torso + arms + legs), simple but human-like */}
        <Path d="
            M74 118
            C74 96 92 78 110 78
            C128 78 146 96 146 118

            L146 164
            C146 176 156 186 168 190
            L168 210
            C168 224 158 234 144 234
            L134 234
            L134 196
            C134 186 126 178 116 178
            L104 178
            C94 178 86 186 86 196
            L86 234
            L76 234
            C62 234 52 224 52 210
            L52 190
            C64 186 74 176 74 164
            Z

            M94 234
            L94 306
            C94 322 82 334 66 334
            L62 334
            C46 334 34 322 34 306
            L34 236
            L94 234
            Z

            M126 234
            L186 236
            L186 306
            C186 322 174 334 158 334
            L154 334
            C138 334 126 322 126 306
            Z
        " />
        </ClipPath>
      </Defs>

      {/* Fill behind, clipped to silhouette */}
      <Rect
        x={0}
        y={fillY}
        width={220}
        height={fillHeight}
        clipPath="url(#silhouetteClip)"
        fill="#0c0c0c"
      />

        {/* Outline */}
        <Path
        d="M110 46a22 22 0 1 0 0.001 0Z"
        fill="none"
        stroke="#9EDCFF"
        strokeWidth={3}
        />
        <Path
        d="
            M74 118
            C74 96 92 78 110 78
            C128 78 146 96 146 118
            L146 164
            C146 176 156 186 168 190
            L168 210
            C168 224 158 234 144 234
            L134 234
            L134 196
            C134 186 126 178 116 178
            L104 178
            C94 178 86 186 86 196
            L86 234
            L76 234
            C62 234 52 224 52 210
            L52 190
            C64 186 74 176 74 164
            Z
            M94 234
            L94 306
            C94 322 82 334 66 334
            L62 334
            C46 334 34 322 34 306
            L34 236
            L94 234
            Z
            M126 234
            L186 236
            L186 306
            C186 322 174 334 158 334
            L154 334
            C138 334 126 322 126 306
            Z
        "
        fill="none"
        stroke="#9EDCFF"
        strokeWidth={3}
        />
    </Svg>
  );
}