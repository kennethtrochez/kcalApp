import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { completeSignIn } from "../../services/authState";
import { getCognitoRedirectUri } from "../../services/cognitoAuth";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function CognitoCallbackScreen() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Completing sign-in...");

  const error = getParamValue(params.error);
  const errorDescription = getParamValue(params.error_description);
  const code = getParamValue(params.code);

  const callbackUrl = useMemo(() => {
    const query = Object.entries(params)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => [key, item] as const);
        }

        return value === undefined ? [] : [[key, value] as const];
      })
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    return query ? `${getCognitoRedirectUri()}?${query}` : getCognitoRedirectUri();
  }, [params]);

  useEffect(() => {
    let alive = true;

    if (error) {
      setStatus("error");
      setMessage(errorDescription ?? error);
      return () => {
        alive = false;
      };
    }

    if (!code) {
      setStatus("error");
      setMessage("Cognito did not return an authorization code.");
      return () => {
        alive = false;
      };
    }

    void (async () => {
      try {
        await completeSignIn(callbackUrl);

        if (!alive) {
          return;
        }

        router.replace("/");
      } catch (nextError) {
        if (!alive) {
          return;
        }

        setStatus("error");
        setMessage(
          nextError instanceof Error ? nextError.message : "Unable to complete Cognito sign-in."
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, [callbackUrl, code, error, errorDescription]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "#2e2a2a",
      }}
    >
      {status === "working" ? <ActivityIndicator size="large" color="#8d84ff" /> : null}
      <Text
        style={{
          marginTop: 16,
          color: "#fff",
          fontSize: 20,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {status === "working" ? "Signing you in" : "Sign-in failed"}
      </Text>
      <Text
        style={{
          marginTop: 10,
          color: "#d6d0d0",
          fontSize: 15,
          lineHeight: 22,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}
