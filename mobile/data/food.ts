export type FoodSource = "manual" | "usda" | "scan"

export type Food = {
    id: string;
    name: string;
    brandOwner?: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    source: FoodSource;
    externalId?: string;
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
  name?: string;
  description?: string;
  brandOwner?: string;
  servingSize?: string | null;
  source: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export function mapBackendFoodToAppFood(data: BackendFood): Food {
  return {
    id: data.fdcId.toString(),
    name: data.name ?? data.description ?? "Unknown Food",
    brandOwner: data.brandOwner,
    servingSize: data.servingSize ?? "Unknown",
    calories: data.calories,
    protein: data.protein,
    carbs: data.carbs,
    fat: data.fat,
    source: "usda",
    externalId: data.fdcId.toString(),
  };
}

// Local Storage
export type LogEntry = {
    id: string;
    food: Food;
    servings: number;
    eatenAtISO: string;
};

export function makeId(): string{
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}