const env =
  typeof globalThis !== "undefined"
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    : undefined;

const idToken = env?.ID_TOKEN ?? "";
const BASE_URL = env?.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return response.json();
}
