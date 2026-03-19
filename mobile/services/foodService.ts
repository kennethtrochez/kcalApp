import { apiGet } from "../lib/api";
import {Food, mapBackendFoodToAppFood} from "../data/food";

export type FoodPreview = {
    fdcId: number;
    description: string;
    dataType: string;
    brandOwner?: string;
};

export async function searchFoods(
    q: string,
    offset?: number,
    pageSize?: number
): Promise<FoodPreview[]>{
    const query = encodeURIComponent(q.trim());

    if (!query) return [];

    const params = new URLSearchParams({ q: query });

    if (offset !== undefined) {
        params.set("offset", String(offset));
    }

    if (pageSize !== undefined) {
        params.set("pageSize", String(pageSize));
    }

    return apiGet<FoodPreview[]>(`/foods/search?${params.toString()}`);
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
