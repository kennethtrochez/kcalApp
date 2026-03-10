import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogEntry } from "../data/food";

const DAY_LOG_KEY = (dayKey: string) => `daylog:${dayKey}`;

// dayKey: YYYY-MM-DD
export function getTodayKey(): string{
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
}

export async function getDayLog(dayKey: string): Promise<LogEntry[]>{
    const raw = await AsyncStorage.getItem(DAY_LOG_KEY(dayKey));
    if(!raw) return [];
    return JSON.parse(raw) as LogEntry[];
}

export async function saveDayLog(dayKey: string, entries: LogEntry[]): Promise<void>{
    await AsyncStorage.setItem(DAY_LOG_KEY(dayKey), JSON.stringify(entries));
}

export async function addToDayLog(dayKey: string, entry: LogEntry): Promise<LogEntry[]>{
    const current = await getDayLog(dayKey);
    const next = [entry, ...current];
    await saveDayLog(dayKey, next);
    return next;
}

export async function clearDayLog(dayKey: string): Promise<void>{
    await AsyncStorage.removeItem(DAY_LOG_KEY(dayKey));
}

export async function getTodayLog(): Promise<LogEntry[]> {
  return getDayLog(getTodayKey());
}