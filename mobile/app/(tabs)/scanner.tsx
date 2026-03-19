import { useRef, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export default function ScannerScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const isFocused = useIsFocused();
  const tabBarHeight = useBottomTabBarHeight();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing] = useState<CameraType>("back");
  const bottomControlsOffset = tabBarHeight + 28;

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
        setCapturedUri(photo.uri);
      }
    } catch (error) {
      Alert.alert("Camera Error", "Unable to capture photo right now.");
    } finally {
      setCapturing(false);
    }
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

        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
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
          Camera permission is required to scan a nutrition label.
        </Text>

        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => ({
            marginTop: 22,
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#2e2a2a" }}>
      {!capturedUri ? (
        <>
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
              top: 68,
              left: 24,
              right: 24,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
              Scanner
            </Text>
            <Text
              style={{
                color: "#d2cdcd",
                fontSize: 14,
                marginTop: 6,
                maxWidth: 260,
                lineHeight: 20,
              }}
            >
              Capture a nutrition label to prepare a manual food entry.
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: bottomControlsOffset,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={capturePhoto}
              disabled={capturing || !cameraReady}
              style={({ pressed }) => ({
                width: 82,
                height: 82,
                borderRadius: 41,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "#d6d0d0" : "#f3eded",
                borderWidth: 6,
                borderColor: "#3a3535",
                opacity: capturing || !cameraReady ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: "#2e2a2a",
                }}
              />
            </Pressable>
          </View>
        </>
      ) : (
        <>
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
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
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
              <Text style={{ color: "#fff", fontWeight: "700" }}>Retake</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert("Continue", "Nutrition extraction will be added later.");
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
              <Text style={{ color: "#fff", fontWeight: "700" }}>Continue</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
