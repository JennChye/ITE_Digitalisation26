export const MIN_SERVINGS = 1;
export const FOOTPRINT_SCALE_MAX = 10;

export type FootprintBand = {
  label: "Lower estimate" | "Medium estimate" | "Higher estimate";
  colorClass: string;
  dotClass: string;
};

export function normaliseServings(servings: number): number {
  if (!Number.isFinite(servings)) return MIN_SERVINGS;
  return Math.max(MIN_SERVINGS, Math.floor(servings));
}

export function calculateTotalCarbonFootprint(
  carbonFootprintPerServing: number,
  servings: number,
): number {
  const total = carbonFootprintPerServing * normaliseServings(servings);
  return Number(total.toFixed(2));
}

export function formatCarbonFootprint(value: number): string {
  return `${value.toFixed(2)} kg CO2e`;
}

export function getFootprintProgress(carbonFootprintPerServing: number): number {
  return Math.min((carbonFootprintPerServing / FOOTPRINT_SCALE_MAX) * 100, 100);
}

export function getFootprintBand(carbonFootprintPerServing: number): FootprintBand {
  if (carbonFootprintPerServing < 2) {
    return {
      label: "Lower estimate",
      colorClass: "bg-[#4b915d]",
      dotClass: "bg-[#4b915d]",
    };
  }

  if (carbonFootprintPerServing < 5) {
    return {
      label: "Medium estimate",
      colorClass: "bg-[#d39a25]",
      dotClass: "bg-[#d39a25]",
    };
  }

  return {
    label: "Higher estimate",
    colorClass: "bg-[#d56540]",
    dotClass: "bg-[#d56540]",
  };
}
