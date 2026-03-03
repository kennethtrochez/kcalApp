import { Macros } from "../types/nutrition";
import { Food, LogEntry } from "../data/food";

export function macrosFromFood(food: Food): Macros{
    return{
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
    };
}

export function addMacros(a: Macros, b: Macros): Macros{
    return{
        calories: a.calories + b.calories,
        protein: a.protein + b.protein,
        carbs: a.carbs + b.carbs,
        fat: a.fat + b.fat,
    }
}

export function multiplyMacros(macros: Macros, servings: number): Macros{
    return{
        calories: macros.calories * servings,
        protein: macros.protein * servings,
        carbs: macros.carbs * servings,
        fat: macros.fat * servings,
    }
}

export function totalMacrosForEntries(entries: LogEntry[]): Macros{
    return entries.reduce<Macros>(
        (acc, entry) => addMacros(acc, multiplyMacros(macrosFromFood(entry.food), entry.servings)),
        {   calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        }
    );
}