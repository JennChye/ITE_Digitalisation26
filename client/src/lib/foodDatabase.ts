export type FoodCategory = "Vegetarian" | "Non Vegetarian";

export type Food = {
  id: string;
  name: string;
  carbonScore: number;
  category: FoodCategory;
  image?: string;
  cardGradient?: string;
  factors: string[];
  estimateMethod: "Published meal research" | "Prototype ingredient estimate";
};

export const FOOD_DATA_SOURCE_URL =
  "https://ipur.nus.edu.sg/insights/the-carbon-intensity-of-food-items-what-you-need-to-know-2/";

export const MEAL_NOT_FOUND_MESSAGE =
  "We could not find this meal yet. Please return to the food list and choose one of the available dishes.";

export const foods: Food[] = [
  {
    id: "chicken-rice",
    name: "Chicken Rice",
    carbonScore: 3.13,
    category: "Non Vegetarian",
    image: "/manus-storage/platefootprint-chicken-rice_a09c186e.png",
    factors: ["Poultry farming", "Imported rice", "Cooking energy"],
    estimateMethod: "Published meal research",
  },
  {
    id: "laksa",
    name: "Laksa",
    carbonScore: 6.53,
    category: "Non Vegetarian",
    image: "/manus-storage/platefootprint-laksa_e2cd3437.png",
    factors: ["Seafood ingredients", "Coconut milk processing", "Cooking energy"],
    estimateMethod: "Published meal research",
  },
  {
    id: "chicken-biryani",
    name: "Chicken Biryani",
    carbonScore: 9.91,
    category: "Non Vegetarian",
    image: "/manus-storage/platefootprint-biryani_a26814ce.png",
    factors: ["Poultry farming", "Imported rice", "Cooking energy"],
    estimateMethod: "Published meal research",
  },
  {
    id: "roti-prata",
    name: "Roti Prata",
    carbonScore: 0.5,
    category: "Vegetarian",
    image: "/manus-storage/platefootprint-roti-prata_561c2526.png",
    factors: ["Flour based dough", "Vegetable curry ingredients", "Cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "nasi-lemak",
    name: "Nasi Lemak",
    carbonScore: 4.2,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #d9e7c4 0%, #86ad72 47%, #3c734e 100%)",
    factors: ["Coconut rice", "Anchovies and egg", "Fried chicken or side dish", "Cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "char-kway-teow",
    name: "Char Kway Teow",
    carbonScore: 3.6,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #f2d7a7 0%, #d17a43 50%, #74402c 100%)",
    factors: ["Rice noodles", "Egg and seafood", "Cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "hokkien-mee",
    name: "Hokkien Mee",
    carbonScore: 4.3,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #f3e3a8 0%, #d9a54d 45%, #4f7659 100%)",
    factors: ["Noodles", "Prawns and seafood broth", "Cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "pork-wanton-mee",
    name: "Pork Wanton Mee",
    carbonScore: 3.4,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #f3d6bb 0%, #cd8965 48%, #71523d 100%)",
    factors: ["Pork filling", "Egg noodles", "Soup preparation"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "fishball-noodle-soup",
    name: "Fishball Noodle Soup",
    carbonScore: 2.8,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #e3f0da 0%, #8db4a4 48%, #2f6d67 100%)",
    factors: ["Fish based ingredients", "Noodles", "Broth cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "mee-soto",
    name: "Mee Soto",
    carbonScore: 3.5,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #f5e7a6 0%, #d7af44 49%, #536b3b 100%)",
    factors: ["Chicken", "Noodles", "Spice paste and broth"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "vegetarian-bee-hoon",
    name: "Vegetarian Bee Hoon",
    carbonScore: 1.1,
    category: "Vegetarian",
    cardGradient: "linear-gradient(135deg, #e7f2cd 0%, #9fbe72 50%, #4b7548 100%)",
    factors: ["Rice vermicelli", "Vegetables and tofu", "Cooking energy"],
    estimateMethod: "Prototype ingredient estimate",
  },
  {
    id: "beef-rendang-rice",
    name: "Beef Rendang Rice",
    carbonScore: 8.3,
    category: "Non Vegetarian",
    cardGradient: "linear-gradient(135deg, #e8cfb4 0%, #a85f43 48%, #53342b 100%)",
    factors: ["Beef", "Coconut rich sauce", "Rice", "Long cooking time"],
    estimateMethod: "Prototype ingredient estimate",
  },
];

export function getFoodById(id: string | undefined): Food | undefined {
  return foods.find((food) => food.id === id);
}
