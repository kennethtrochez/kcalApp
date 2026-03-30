import { handleAuthRedirect, signInWithCognito, signOutFromCognito, signUpWithCognito } from "./cognitoAuth";
import { getCurrentIdToken, clearCurrentIdToken } from "./authToken";
import { setAppMode } from "./appMode";

export async function hasStoredIdToken(): Promise<boolean> {
  const token = await getCurrentIdToken();
  return Boolean(token);
}

export async function signIn(): Promise<void> {
  await signInWithCognito();
}

export async function signUp(): Promise<void> {
  await signUpWithCognito();
}

export async function completeSignIn(url?: string): Promise<void> {
  await handleAuthRedirect(url);
  await setAppMode("authenticated");
}

export async function signOut(): Promise<void> {
  await signOutFromCognito();
  await clearCurrentIdToken();
  await setAppMode("local");
}
