import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";

import { Food, LogEntry, makeId } from "../../data/food";
import { parseNutritionLabelText } from "../../lib/nutritionLabelScan";
import { addToDayLog, getTodayKey } from "../../lib/storage";

type ScanSource = "camera" | "library" | null;

export default function ScannerScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();
  const [fontsLoaded] = useFonts({
    MetalMania: require("../../assets/fonts/MetalMania-Regular.ttf"),
  });
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [servingDescription, setServingDescription] = useState("");
  const [servings, setServings] = useState("1");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [rawScanText, setRawScanText] = useState("");
  const [scanSource, setScanSource] = useState<ScanSource>(null);
  const [facing] = useState<CameraType>("back");
  const bottomControlsOffset = tabBarHeight + 16;
  const scannerTitleStyle = {
    color: "#f7f4f4",
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: 2,
    fontFamily: fontsLoaded ? "MetalMania" : undefined,
  };

  function resetReviewFields() {
    setReviewMode(false);
    setScanMessage(null);
    setFoodName("");
    setServingDescription("");
    setServings("1");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setRawScanText("");
  }

  function resetScanner() {
    setCapturedUri(null);
    setCameraReady(false);
    setAnalyzing(false);
    setScanSource(null);
    resetReviewFields();
  }

  function formatNumber(value: number | undefined): string {
    return value === undefined ? "" : String(value);
  }

  function parseNumericInput(value: string): number {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function analyzeImageUri(imageUri: string) {
    try {
      setAnalyzing(true);
      setScanMessage(null);

      // Restored scanner OCR wiring now that dev builds can load a native ML Kit module.
      const recognized = await recognizeText(imageUri);
      const parsed = parseNutritionLabelText(recognized.text ?? "");

      setRawScanText(parsed.rawText);
      setServingDescription(parsed.servingSize ?? "");
      setCalories(formatNumber(parsed.calories));
      setProtein(formatNumber(parsed.protein));
      setCarbs(formatNumber(parsed.carbs));
      setFat(formatNumber(parsed.fat));

      if (parsed.detectedFieldCount === 0) {
        setScanMessage("No usable nutrition facts were detected. You can retry or fill the fields manually.");
      } else {
        setScanMessage("Review the scanned nutrition facts and fill in anything that was missed.");
      }

      setReviewMode(true);
    } catch {
      setScanMessage("Text recognition could not read this image. Try again with a clearer nutrition label photo.");
      Alert.alert(
        "Scan Failed",
        "Nutrition extraction could not read this label. Retake the image or choose a clearer photo."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function capturePhoto() {
    if (!cameraRef.current || capturing || !cameraReady) {
      return;
    }

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        resetReviewFields();
        setScanSource("camera");
        setCapturedUri(photo.uri);
        await analyzeImageUri(photo.uri);
      }
    } catch {
      Alert.alert("Camera Error", "Unable to capture photo right now.");
    } finally {
      setCapturing(false);
    }
  }

  async function openPhotoLibrary() {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!libraryPermission.granted) {
      Alert.alert("Photos Permission", "Photo library access is required to upload a nutrition label image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    resetReviewFields();
    setScanSource("library");
    setCapturedUri(result.assets[0].uri);
    await analyzeImageUri(result.assets[0].uri);
  }

  async function logScannedFood() {
    const trimmedName = foodName.trim();
    const trimmedServingDescription = servingDescription.trim();
    const servingsValue = Math.max(0.01, parseNumericInput(servings) || 1);

    if (!trimmedName) {
      Alert.alert("Food Name Required", "Enter a food name before logging this item.");
      return;
    }

    const food: Food = {
      id: makeId(),
      name: trimmedName,
      servingSize: trimmedServingDescription || "1 serving",
      calories: Math.max(0, parseNumericInput(calories)),
      protein: Math.max(0, parseNumericInput(protein)),
      carbs: Math.max(0, parseNumericInput(carbs)),
      fat: Math.max(0, parseNumericInput(fat)),
      source: "scan",
    };

    const entry: LogEntry = {
      id: makeId(),
      food,
      servings: servingsValue,
      eatenAtISO: new Date().toISOString(),
    };

    await addToDayLog(getTodayKey(), entry);
    Alert.alert("Logged", "Scanned nutrition was added to today's log.");
    resetScanner();
  }

  if (reviewMode && capturedUri) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#2e2a2a" }}
        contentContainerStyle={{ paddingBottom: bottomControlsOffset }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: capturedUri }}
          style={{ width: "100%", height: 270 }}
          resizeMode="cover"
        />

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 18,
            gap: 14,
          }}
        >
          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#4a4545",
              gap: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
              Review Scan
            </Text>
            <Text style={{ color: "#d2cdcd", fontSize: 14, lineHeight: 20 }}>
              {scanMessage ?? "Review the detected nutrition facts before logging."}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#4a4545",
              gap: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Food Details
            </Text>

            <View>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                Food Name
              </Text>
              <TextInput
                value={foodName}
                onChangeText={setFoodName}
                placeholder="ex. Greek yogurt"
                placeholderTextColor="#888"
                style={{
                  borderWidth: 1,
                  borderColor: "#4a4545",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 14,
                  color: "#fff",
                  backgroundColor: "#2e2a2a",
                }}
              />
            </View>

            <View>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                Serving Description
              </Text>
              <TextInput
                value={servingDescription}
                onChangeText={setServingDescription}
                placeholder="ex. 2/3 cup (55 g)"
                placeholderTextColor="#888"
                style={{
                  borderWidth: 1,
                  borderColor: "#4a4545",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 14,
                  color: "#fff",
                  backgroundColor: "#2e2a2a",
                }}
              />
            </View>

            <View>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                Servings
              </Text>
              <TextInput
                value={servings}
                onChangeText={setServings}
                placeholder="1"
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 1,
                  borderColor: "#4a4545",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 14,
                  color: "#fff",
                  backgroundColor: "#2e2a2a",
                }}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#3a3535",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#4a4545",
              gap: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Nutrition Facts
            </Text>

            {[
              { label: "Calories", value: calories, setter: setCalories },
              { label: "Protein", value: protein, setter: setProtein },
              { label: "Carbs", value: carbs, setter: setCarbs },
              { label: "Fat", value: fat, setter: setFat },
            ].map((field) => (
              <View key={field.label}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                  {field.label}
                </Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#4a4545",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    color: "#fff",
                    backgroundColor: "#2e2a2a",
                  }}
                />
              </View>
            ))}
          </View>

          {rawScanText ? (
            <View
              style={{
                backgroundColor: "#3a3535",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "#4a4545",
                gap: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Scanned Preview
              </Text>
              <Text style={{ color: "#bdb4b4", fontSize: 13, lineHeight: 20 }}>
                {rawScanText}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => {
                setReviewMode(false);
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: pressed ? "#4a4545" : "#3a3535",
                borderWidth: 1,
                borderColor: "#5b5555",
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {scanSource === "library" ? "Choose Another" : "Back"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void logScannedFood();
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: pressed ? "#5b5567" : "#6b5cff",
                borderWidth: 1,
                borderColor: "#8d84ff",
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Log Food</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (capturedUri) {
    return (
      <View style={{ flex: 1, backgroundColor: "#2e2a2a" }}>
        <Image
          source={{ uri: capturedUri }}
          style={{ flex: 1 }}
          resizeMode="cover"
        />

        <View
          style={{
            position: "absolute",
            top: 68,
            left: 24,
            right: 24,
          }}
        >
          <Text style={scannerTitleStyle}>
            Scanner
          </Text>
          <Text
            style={{
              color: "#d2cdcd",
              fontSize: 14,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            Review the captured label before continuing.
          </Text>
        </View>

        <View
          style={{
            position: "absolute",
            bottom: bottomControlsOffset - 8,
            left: 24,
            right: 24,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => {
              setCapturedUri(null);
              setCameraReady(false);
              setReviewMode(false);
              setScanMessage(null);
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: pressed ? "#4a4545" : "#3a3535",
              borderWidth: 1,
              borderColor: "#5b5555",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {scanSource === "library" ? "Choose Another" : "Retake"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void analyzeImageUri(capturedUri);
            }}
            disabled={analyzing}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: pressed ? "#5b5567" : "#6b5cff",
              borderWidth: 1,
              borderColor: "#8d84ff",
              opacity: analyzing ? 0.75 : 1,
            })}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Continue</Text>
            )}
          </Pressable>
        </View>

        {scanMessage ? (
          <View
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: bottomControlsOffset + 76,
              backgroundColor: "rgba(58, 53, 53, 0.96)",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#4a4545",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, lineHeight: 20 }}>
              {scanMessage}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#2e2a2a",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#2e2a2a",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#3a3535",
            borderWidth: 1,
            borderColor: "#4a4545",
            marginBottom: 18,
          }}
        >
          <Ionicons name="camera-outline" size={34} color="#8d84ff" />
        </View>

          <Text style={scannerTitleStyle}>
            Scanner
          </Text>

        <Text
          style={{
            color: "#bdb4b4",
            fontSize: 15,
            textAlign: "center",
            marginTop: 10,
            maxWidth: 280,
            lineHeight: 22,
          }}
        >
          Camera permission is required to scan a nutrition label. You can still upload from the gallery after allowing photos.
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: pressed ? "#5b5567" : "#6b5cff",
              borderWidth: 1,
              borderColor: "#8d84ff",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Try Again
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void openPhotoLibrary();
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: pressed ? "#4a4545" : "#3a3535",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Upload Photo
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#2e2a2a" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        active={isFocused}
        onCameraReady={() => setCameraReady(true)}
      />

      <View
        style={{
          position: "absolute",
          top: 46,
          left: 24,
          right: 24,
        }}
      >
        <Text style={[scannerTitleStyle, { marginTop: 12 }]}>
          Scanner
        </Text>
        <Text
          style={{
            color: "#d2cdcd",
            fontSize: 14,
            marginTop: -4,
            marginBottom: 26,
            maxWidth: 260,
            lineHeight: 20,
          }}
        >
          Capture a nutrition label or use the gallery button to upload one.
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          top: 150,
          left: 24,
          right: 24,
          bottom: bottomControlsOffset + 70,
          borderRadius: 28,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.65)",
          backgroundColor: "transparent",
        }}
      />

      <View
        style={{
          position: "absolute",
          bottom: bottomControlsOffset,
          left: 24,
          right: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ width: 56, alignItems: "center" }}>
          <Pressable
            onPress={() => {
              void openPhotoLibrary();
            }}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "rgba(58,53,53,0.95)" : "rgba(46,42,42,0.92)",
              borderWidth: 1,
              borderColor: "#4a4545",
            })}
          >
            <Ionicons name="images-outline" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Balanced side slots keep the shutter visually centered even with the gallery action present. */}
        <View style={{ width: 68, alignItems: "center" }}>
          <Pressable
            onPress={capturePhoto}
            disabled={capturing || !cameraReady}
            style={({ pressed }) => ({
              width: 68,
              height: 68,
              borderRadius: 34,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#d6d0d0" : "#f3eded",
              borderWidth: 5,
              borderColor: "#3a3535",
              opacity: capturing || !cameraReady ? 0.6 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#2e2a2a",
              }}
            />
          </Pressable>
        </View>

        <View style={{ width: 56 }} />
      </View>
    </View>
  );
}
