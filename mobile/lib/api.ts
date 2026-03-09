import { Platform } from "react-native";

const LAN_IP = "http://192.168.4.37:8000"; // put your PC IPv4 here
const BASE_URL = Platform.OS === "web" ? "http://localhost:8000" : LAN_IP;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  return handleResponse<T>(response);
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}