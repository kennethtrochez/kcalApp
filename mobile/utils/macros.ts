import { Macros } from "../types/nutrition"

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