import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { setCurrentIdToken } from "./authToken";

WebBrowser.maybeCompleteAuthSession();

type PendingCognitoAuthRequest = Pick<
  AuthSession.AuthRequest,
  "codeVerifier" | "redirectUri" | "parseReturnUrl"
>;

type CognitoConfig = {
  clientId: string;
  domain: string;
  redirectUri: string;
  scopes: string[];
};

type CognitoEntryPoint = "signin" | "signup";

const SHARED_COGNITO_SCOPES = ["openid"];

export type CognitoAuthResult = {
  redirectUri: string;
  status: "pending" | "signed_in" | "signed_out";
};

let pendingAuthRequest: PendingCognitoAuthRequest | undefined;

function getAppScheme(): string {
  const scheme = Constants.expoConfig?.scheme;
  const resolvedScheme = Array.isArray(scheme) ? scheme[0] : scheme;

  if (!resolvedScheme) {
    throw new Error("Expo app scheme is not configured.");
  }

  return resolvedScheme;
}

function getCognitoDomain(): string {
  const rawDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.trim();

  if (!rawDomain) {
    throw new Error("EXPO_PUBLIC_COGNITO_DOMAIN is not set.");
  }

  return rawDomain.startsWith("https://") ? rawDomain : `https://${rawDomain}`;
}

function getCognitoConfig(): CognitoConfig {
  const clientId = process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("EXPO_PUBLIC_COGNITO_APP_CLIENT_ID is not set.");
  }

  return {
    clientId,
    domain: getCognitoDomain(),
    redirectUri: getCognitoRedirectUri(),
    scopes: SHARED_COGNITO_SCOPES,
  };
}

function getDiscovery(domain: string): AuthSession.DiscoveryDocument {
  return {
    authorizationEndpoint: `${domain}/oauth2/authorize`,
    tokenEndpoint: `${domain}/oauth2/token`,
    revocationEndpoint: `${domain}/oauth2/revoke`,
  };
}

function getEntryDiscovery(
  domain: string,
  entryPoint: CognitoEntryPoint
): AuthSession.DiscoveryDocument {
  if (entryPoint === "signup") {
    return {
      authorizationEndpoint: `${domain}/signup`,
      tokenEndpoint: `${domain}/oauth2/token`,
      revocationEndpoint: `${domain}/oauth2/revoke`,
    };
  }

  return getDiscovery(domain);
}

export function getCognitoRedirectUri(): string {
  const scheme = getAppScheme();
  return `${scheme}://auth/callback`;
}

async function beginCognitoAuth(entryPoint: CognitoEntryPoint): Promise<CognitoAuthResult> {
  const config = getCognitoConfig();
  const discovery = getEntryDiscovery(config.domain, entryPoint);
  const request = new AuthSession.AuthRequest({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: config.scopes,
    usePKCE: true,
  });
  const authorizeUrl = await request.makeAuthUrlAsync(discovery);

  pendingAuthRequest = request;
  const result = await request.promptAsync(discovery, { url: authorizeUrl });

  if (result.type !== "success") {
    return {
      redirectUri: config.redirectUri,
      status: "pending",
    };
  }

  return {
    redirectUri: config.redirectUri,
    status: "pending",
  };
}

export async function signInWithCognito(): Promise<CognitoAuthResult> {
  return beginCognitoAuth("signin");
}

export async function signUpWithCognito(): Promise<CognitoAuthResult> {
  return beginCognitoAuth("signup");
}

export async function handleAuthRedirect(
  url?: string,
  request?: PendingCognitoAuthRequest
): Promise<CognitoAuthResult> {
  const config = getCognitoConfig();
  const activeRequest = request ?? pendingAuthRequest;

  if (!url || !activeRequest) {
    return {
      redirectUri: config.redirectUri,
      status: "pending",
    };
  }

  const result = activeRequest.parseReturnUrl(url);
  const params = "params" in result ? result.params : {};
  const error = typeof params.error === "string" ? params.error : undefined;
  const errorDescription =
    typeof params.error_description === "string" ? params.error_description : undefined;
  const code = result.type === "success" && typeof params.code === "string" ? params.code : undefined;

  if (error) {
    throw new Error(
      errorDescription
        ? `Cognito authorization failed: ${errorDescription}`
        : `Cognito authorization failed: ${error}`
    );
  }

  if (!code) {
    throw new Error("Cognito redirect did not include an authorization code.");
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: config.clientId,
      code,
      redirectUri: activeRequest.redirectUri,
      extraParams: {
        code_verifier: activeRequest.codeVerifier ?? "",
      },
    },
    getDiscovery(config.domain)
  );
  const rawResponse =
    tokenResponse.rawResponse && typeof tokenResponse.rawResponse === "object"
      ? (tokenResponse.rawResponse as Record<string, unknown> & { id_token?: string })
      : undefined;
  const idToken = tokenResponse.idToken ?? rawResponse?.id_token;
  if (!idToken) {
    throw new Error("Cognito token exchange did not return an id_token.");
  }

  pendingAuthRequest = undefined;
  await setCurrentIdToken(idToken);

  return {
    redirectUri: activeRequest.redirectUri,
    status: "signed_in",
  };
}

export async function signOutFromCognito(): Promise<CognitoAuthResult> {
  return {
    redirectUri: getCognitoRedirectUri(),
    status: "signed_out",
  };
}
