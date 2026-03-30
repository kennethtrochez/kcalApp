export type ParsedNutritionLabel = {
  rawText: string;
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  detectedFieldCount: number;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function matchNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseNumber(match?.[1]);

    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
}

function matchServingSize(lines: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/(?:serving size|serv size|serving)\s*[:\-]?\s*(.+)$/i);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

export function parseNutritionLabelText(rawText: string): ParsedNutritionLabel {
  const normalizedText = normalizeWhitespace(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const calories = matchNumber(normalizedText, [
    /calories?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /energy\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
  ]);
  const protein = matchNumber(normalizedText, [/protein\s*[:\-]?\s*(\d+(?:\.\d+)?)/i]);
  const carbs = matchNumber(normalizedText, [
    /(?:total\s+)?carbohydrate[s]?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /carbs?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
  ]);
  const fat = matchNumber(normalizedText, [/(?:total\s+)?fat\s*[:\-]?\s*(\d+(?:\.\d+)?)/i]);
  const servingSize = matchServingSize(lines);

  const detectedFieldCount = [servingSize, calories, protein, carbs, fat].filter(
    (value) => value !== undefined
  ).length;

  return {
    rawText: normalizedText,
    servingSize,
    calories,
    protein,
    carbs,
    fat,
    detectedFieldCount,
  };
}
