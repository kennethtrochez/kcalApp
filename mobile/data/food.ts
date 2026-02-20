export type FoodSource = "manual" | "usda" | "scan"

export type Food = {
    id: string;
    name: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    source: FoodSource;
    externalId?: string;
};

export type LogEntry = {
    foodid: string;
    name: string;
    servings: number;
    timestamp: number;
};

export type MacroTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

// Backend
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

export function mapBackendFoodToAppFood(data: BackendFood): Food{
    return{
        id: data.fdcId.toString(),
        name: data.name,
        servingSize: data.servingSize ?? "Unkown",
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        source: "usda",
        externalId: data.fdcId.toString(),
    };
}