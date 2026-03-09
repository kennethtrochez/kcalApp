import React, { useMemo } from "react";
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";

type MacroColors = {
  protein: string;
  carbs: string;
  fat: string;
};

type Props = {
  width: number;
  height: number;

  caloriesConsumed: number;
  calorieGoal: number;

  proteinG: number;
  carbsG: number;
  fatG: number;

  colors?: Partial<MacroColors>;
  style?: ViewStyle;
};

const DEFAULT_COLORS: MacroColors = {
  protein: "#7C3AED", // purple
  carbs: "#F59E0B",   // orange
  fat: "#FDE047",     // yellow
};

function clamp01(x: number) {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export default function BodyFill({
  width,
  height,
  caloriesConsumed,
  calorieGoal,
  proteinG,
  carbsG,
  fatG,
  colors,
  style,
}: Props) {
  const c = { ...DEFAULT_COLORS, ...(colors ?? {}) };

  const { fillHeight, proteinH, carbsH, fatH } = useMemo(() => {
    const safeGoal = calorieGoal > 0 ? calorieGoal : 1;
    const progress = clamp01(caloriesConsumed / safeGoal);
    const fh = height * progress;

    const pCals = Math.max(0, proteinG) * 4;
    const cCals = Math.max(0, carbsG) * 4;
    const fCals = Math.max(0, fatG) * 9;
    const total = pCals + cCals + fCals;

    if (fh <= 0 || total <= 0) {
      return { fillHeight: fh, proteinH: 0, carbsH: 0, fatH: 0 };
    }

    return {
      fillHeight: fh,
      proteinH: fh * (pCals / total),
      carbsH: fh * (cCals / total),
      fatH: fh * (fCals / total),
    };
  }, [caloriesConsumed, calorieGoal, proteinG, carbsG, fatG, height]);

  return (
    <View style={[{ width, height }, style]}>
      <MaskedView
        style={{ width, height }}
        maskElement={
          <Image
            source={require("../assets/images/bodymask3d.png")}
            style={{
              width,
              height,
              resizeMode: "contain",
              transform: [{ translateX: -9 }, { translateY: -5 }],
            }}
          />
        }
      >

        {/* Filled region anchored at bottom, clipped to fillHeight */}
        <View style={[StyleSheet.absoluteFillObject, { width, height }]}>
          <View style={[styles.fillContainer, { width, height: fillHeight }]}>
            <View style={styles.stack}>
              <View style={{ height: fatH, backgroundColor: c.fat, width: "100%" }} />
              <View style={{ height: carbsH, backgroundColor: c.carbs, width: "100%" }} />
              <View style={{ height: proteinH, backgroundColor: c.protein, width: "100%" }} />
            </View>
          </View>
        </View>
      </MaskedView>

      {/* Outline on top */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0 , opacity: 0.65}}>
        <Image
          source={require("../assets/images/3Dbodysilhouette.png")}
          style={{
            width,
            height,
            resizeMode: "contain",
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fillContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  stack: {
    flex: 1,
    width: "100%",
    flexDirection: "column-reverse",
  },
});