from typing import Any

from fastapi import Depends, FastAPI, Header
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
import requests
import re
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict
from src.aws.dynamodb import get_profile_item, put_profile_item
from src.aws.cognito_auth import verify_bearer_token

# Load USDA API KEY and check it loaded.
load_dotenv()
USDA_API_KEY = os.getenv("USDA_API_KEY")

if not USDA_API_KEY:
    raise ValueError("USDA_API_KEY not found")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running."}


class ProfilePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    displayName: str | None = None


def get_current_claims(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    return verify_bearer_token(authorization or "")

# Food search
@app.get("/foods/search")
def search_foods(q: str, offset: int = 0, pageSize: int = 10, foodType: str = "all", brand: str | None = None):
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    if pageSize <= 0:
        raise HTTPException(status_code=400, detail="pageSize must be > 0")

    if foodType not in {"all", "branded", "generic"}:
        raise HTTPException(status_code=400, detail="foodType must be all, branded, or generic")

    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    page_number = (offset // pageSize) + 1

    params = {
        "api_key": USDA_API_KEY
    }

    body = {
        "query": q,
        "pageSize": pageSize,
        "pageNumber": page_number,
    }
    
    response = requests.post(url, params=params, json=body)

    # Code 502 = "Bad Gateway"
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="USDA API error")

    data = response.json()
    foods = data.get("foods", [])

    cleaned_res = format_usda_results(foods)
    ranked_res = rank_search_results(cleaned_res, q, foodType, brand)

    return ranked_res

# Combine Food info and macros
@app.get("/foods/usda/{fdcId}")
def get_usda_food(fdcId: int):
    data = fetch_usda_food(fdcId)
    info = extract_basic_info(data)
    macros = extract_macros(data)
    return info | macros


@app.get("/me/profile")
def get_my_profile(claims: dict[str, Any] = Depends(get_current_claims)):
    user_id = claims["sub"]

    try:
        item = get_profile_item(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DynamoDB read failed: {exc}")

    if item:
        return item

    return {"userID": user_id}


@app.put("/me/profile")
def put_my_profile(
    payload: ProfilePayload,
    claims: dict[str, Any] = Depends(get_current_claims),
):
    user_id = claims["sub"]

    profile_data = payload.model_dump(exclude_unset=True)
    if payload.model_extra:
        profile_data.update(payload.model_extra)

    profile_data.pop("userID", None)

    now = datetime.now(timezone.utc).isoformat()

    try:
        existing_item = get_profile_item(user_id) or {}
        item = {
            **existing_item,
            **profile_data,
            "userID": user_id,
            "updatedAt": now,
        }
        if "createdAt" not in item:
            item["createdAt"] = now

        return put_profile_item(item)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DynamoDB write failed: {exc}")

# Grab food data
def fetch_usda_food(fdcId: int):
    url = f"https://api.nal.usda.gov/fdc/v1/food/{fdcId}"
    params = {"api_key": USDA_API_KEY}
    response = requests.get(url, params=params)

    # Code 502 = "Bad Gateway"
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="USDA API error")
    
    return response.json()

# Format search results
def format_usda_results(foods):
    cleaned = []

    for food in foods:
        item = {
            "fdcId": food.get("fdcId"),
            "description": food.get("description"),
            "dataType": food.get("dataType"),
            "brandOwner": food.get("brandOwner")
        }

        cleaned.append(item)

    return cleaned

def normalize_query_terms(query: str):
    filler_words = {"of", "from", "a", "an", "the", "for"}
    quantity_words = {
        "slice", "slices", "cup", "cups", "tbsp", "tsp", "oz", "ounce",
        "ounces", "g", "gram", "grams", "lb", "lbs", "serving", "servings",
        "piece", "pieces",
    }

    cleaned = re.sub(r"[^a-z0-9\s]", " ", query.lower())
    tokens = [token for token in cleaned.split() if token]

    index = 0
    while index < len(tokens) and tokens[index].isdigit():
        index += 1

        if index < len(tokens) and tokens[index] in quantity_words:
            index += 1

    return [token for token in tokens[index:] if token not in filler_words]

def score_search_result(item, query_terms, food_type: str, brand_terms):
    description = (item.get("description") or "").lower()
    brand_owner = (item.get("brandOwner") or "").lower()
    data_type = (item.get("dataType") or "").lower()
    is_branded = "branded" in data_type

    score = 0
    description_matches = 0
    brand_matches = 0
    brand_filter_matches = 0

    for term in query_terms:
        if term in description:
            score += 10
            description_matches += 1

            if description.startswith(term):
                score += 2

        if brand_owner and term in brand_owner:
            score += 5
            brand_matches += 1

    for term in brand_terms:
        if brand_owner and term in brand_owner:
            score += 18
            brand_filter_matches += 1

            if brand_owner.startswith(term):
                score += 4
        elif term in description:
            score += 6

    if description_matches >= 2:
        score += 6

    if brand_matches >= 1 and description_matches >= 1:
        score += 4

    if brand_filter_matches >= 1 and description_matches >= 1:
        score += 10

    if brand_terms and brand_filter_matches == 0:
        score -= 12

    if description_matches == 0 and brand_matches <= 1:
        score -= 5

    if food_type == "branded":
        score += 8 if is_branded else -4
    elif food_type == "generic":
        score += 8 if not is_branded else -6

    return score

def rank_search_results(items, query: str, food_type: str, brand: str | None = None):
    query_terms = normalize_query_terms(query)
    brand_terms = normalize_query_terms(brand or "")

    if not query_terms and not brand_terms:
        return items

    ranked_items = sorted(
        enumerate(items),
        key=lambda pair: (
            score_search_result(pair[1], query_terms, food_type, brand_terms),
            -pair[0],
        ),
        reverse=True,
    )

    return [item for _, item in ranked_items]

# Grab basic Food information
def extract_basic_info(data):
    serving_size = data.get("servingSize")
    serving_unit = data.get("servingSizeUnit")

    serving_str = None
    if serving_size and serving_unit:
        serving_str = f"{serving_size} {serving_unit}"

    return{
        "fdcId": data.get("fdcId"),
        "description": data.get("description"),
        "dataType": data.get("dataType"),
        "brandOwner": data.get("brandOwner"),
        "servingSize": serving_str,
        "source": "usda",
    }

# Grab macro information
def extract_macros(data):
    nutrients = data.get("foodNutrients", [])

    calories = 0
    protein = 0
    carbs = 0
    fat = 0

    for i in nutrients:
        nutrient_name = i.get("nutrient", {}).get("name")
        amount = i.get("amount", 0)

        if nutrient_name == "Energy":
            calories = amount
        elif nutrient_name == "Protein":
            protein = amount
        elif nutrient_name == "Carbohydrate, by difference":
            carbs = amount
        elif nutrient_name == "Total lipid (fat)":
            fat = amount

    macros = {
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat
    }

    return macros

    
