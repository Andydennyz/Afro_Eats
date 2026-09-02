export type RecipeData = {
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  calories: string;
  ingredients: { amount: string; name: string }[];
  steps: { step: number; instruction: string }[];
};

export const DEFAULT_RECIPE_DATA: RecipeData = {
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: "Medium",
  cuisine: "",
  calories: "",
  ingredients: [{ amount: "", name: "" }],
  steps: [{ step: 1, instruction: "" }],
};
