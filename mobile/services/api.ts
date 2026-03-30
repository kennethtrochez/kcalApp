import { getCurrentIdToken } from "./authToken";
import { BASE_URL } from "./apiConfig";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const method = options.method ?? "GET";
  const idToken = await getCurrentIdToken();
  const headers: Record<string, string> = {};

  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(options.headers)) {
    for (const [key, value] of options.headers) {
      headers[key] = value;
    }
  } else if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
