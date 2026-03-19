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

function formatUsdaFoodName(name: string | undefined, brandOwner?: string): string {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return "Unknown Food";
  }

  // Only normalize generic-looking USDA names that arrive fully uppercased.
  if (brandOwner || trimmedName !== trimmedName.toUpperCase()) {
    return trimmedName;
  }

  return trimmedName
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

export function mapBackendFoodToAppFood(data: BackendFood): Food {
  return {
    id: data.fdcId.toString(),
    name: formatUsdaFoodName(data.name ?? data.description, data.brandOwner),
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
