import { foods, getFoodById } from "./foodDatabase";
import { describe, expect, it } from "vitest";

describe("expanded Singapore food database", () => {
  it("includes additional commonly found Singapore dishes", () => {
    expect(getFoodById("nasi-lemak")?.name).toBe("Nasi Lemak");
    expect(getFoodById("char-kway-teow")?.name).toBe("Char Kway Teow");
    expect(getFoodById("vegetarian-bee-hoon")?.category).toBe("Vegetarian");
  });

  it("labels added meal values as prototype ingredient estimates", () => {
    const addedDish = getFoodById("hokkien-mee");
    expect(addedDish?.estimateMethod).toBe("Prototype ingredient estimate");
    expect(getFoodById("roti-prata")?.estimateMethod).toBe("Prototype ingredient estimate");
    expect(foods.filter((food) => food.estimateMethod === "Published meal research")).toHaveLength(3);
  });
});
