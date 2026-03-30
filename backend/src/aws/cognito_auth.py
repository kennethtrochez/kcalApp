import os
from functools import lru_cache

import requests
from dotenv import load_dotenv
from fastapi import HTTPException
from jose import JWTError, jwt

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")
COGNITO_JWKS_URL = os.getenv("COGNITO_JWKS_URL")


def _require_env(name: str, value: str | None) -> str:
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


def get_cognito_issuer() -> str:
    region = _require_env("AWS_REGION", AWS_REGION)
    user_pool_id = _require_env("COGNITO_USER_POOL_ID", COGNITO_USER_POOL_ID)
    return f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"


@lru_cache(maxsize=1)
def fetch_jwks() -> dict:
    jwks_url = _require_env("COGNITO_JWKS_URL", COGNITO_JWKS_URL)
    response = requests.get(jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


def _get_signing_key(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token header: {exc}")

    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token header missing kid")

    jwks = fetch_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    raise HTTPException(status_code=401, detail="Signing key not found for token")


def _extract_bearer_token(authorization: str) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return token


def verify_cognito_token(token: str) -> dict:
    try:
        unverified_claims = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token payload: {exc}")

    token_use = unverified_claims.get("token_use")
    key = _get_signing_key(token)
    issuer = get_cognito_issuer()

    decode_kwargs = {
        "key": key,
        "algorithms": ["RS256"],
        "issuer": issuer,
    }

    if token_use == "id":
        decode_kwargs["audience"] = _require_env("COGNITO_APP_CLIENT_ID", COGNITO_APP_CLIENT_ID)
        decode_kwargs["options"] = {"verify_at_hash": False}
    else:
        decode_kwargs["options"] = {"verify_aud": False}

    try:
        claims = jwt.decode(token, **decode_kwargs)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {exc}")

    if claims.get("token_use") == "access":
        expected_client_id = _require_env("COGNITO_APP_CLIENT_ID", COGNITO_APP_CLIENT_ID)
        if claims.get("client_id") != expected_client_id:
            raise HTTPException(status_code=401, detail="Token client_id does not match app client")

    return claims


def verify_bearer_token(authorization: str) -> dict:
    token = _extract_bearer_token(authorization)
    return verify_cognito_token(token)
