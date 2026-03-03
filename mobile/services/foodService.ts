import { apiGet } from "../lib/api";
import {Food, mapBackendFoodToAppFood} from "../data/food";

export type FoodPreview = {
    fdcId: number;
    description: string;
    dataType: string;
    brandOwner?: string;
};

export async function searchFoods(q: string): Promise<FoodPreview[]>{
    const query = encodeURIComponent(q.trim());

    if (!query) return [];

    return apiGet<FoodPreview[]>(`/foods/search?q=${query}`);
}

type BackendFood = {
    fdcId: number;
    name: string;
    brandOwner?: string;
    servingSize?: string;
    source: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export async function getFoodDetails(fdcId: number): Promise<Food>{
    const data = await apiGet<BackendFood>(`/foods/usda/${fdcId}`);
    return mapBackendFoodToAppFood(data);
}