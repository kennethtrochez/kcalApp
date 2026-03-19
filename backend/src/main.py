from fastapi import FastAPI
import os
from dotenv import load_dotenv
import requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException

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

# Food search
@app.get("/foods/search")
def search_foods(q: str, offset: int = 0, pageSize: int = 10):
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    if pageSize <= 0:
        raise HTTPException(status_code=400, detail="pageSize must be > 0")

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

    return cleaned_res

# Combine Food info and macros
@app.get("/foods/usda/{fdcId}")
def get_usda_food(fdcId: int):
    data = fetch_usda_food(fdcId)
    info = extract_basic_info(data)
    macros = extract_macros(data)
    return info | macros

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

    
