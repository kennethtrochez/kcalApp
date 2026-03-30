import AsyncStorage from "@react-native-async-storage/async-storage";

const ID_TOKEN_KEY = "auth:id_token";

export async function getCurrentIdToken(): Promise<string | null> {
  return AsyncStorage.getItem(ID_TOKEN_KEY);
}

export async function setCurrentIdToken(token: string): Promise<void> {
  await AsyncStorage.setItem(ID_TOKEN_KEY, token);
}

export async function clearCurrentIdToken(): Promise<void> {
  await AsyncStorage.removeItem(ID_TOKEN_KEY);
}
