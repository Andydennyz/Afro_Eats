import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { RecipeData } from "./recipe-types.ts";

type Props = {
  data: RecipeData;
  onChange: (data: RecipeData) => void;
};

export default function RecipeFields({ data, onChange }: Props) {
  const set = <K extends keyof RecipeData>(key: K, value: RecipeData[K]) =>
    onChange({ ...data, [key]: value });

  const addIngredient = () =>
    set("ingredients", [...data.ingredients, { amount: "", name: "" }]);

  const removeIngredient = (i: number) =>
    set("ingredients", data.ingredients.filter((_, idx) => idx !== i));

  const updateIngredient = (i: number, field: "amount" | "name", value: string) =>
    set(
      "ingredients",
      data.ingredients.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)),
    );

  const addStep = () =>
    set("steps", [...data.steps, { step: data.steps.length + 1, instruction: "" }]);

  const removeStep = (i: number) =>
    set(
      "steps",
      data.steps
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, step: idx + 1 })),
    );

  const updateStep = (i: number, value: string) =>
    set(
      "steps",
      data.steps.map((s, idx) => (idx === i ? { ...s, instruction: value } : s)),
    );

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🍲</span>
        <h3 className="font-semibold text-sm text-primary uppercase tracking-wide">
          Recipe Details
        </h3>
      </div>

      {/* Time, servings, difficulty row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Prep Time (min)</Label>
          <Input
            type="number"
            min={0}
            value={data.prepTime}
            onChange={(e) => set("prepTime", Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Cook Time (min)</Label>
          <Input
            type="number"
            min={0}
            value={data.cookTime}
            onChange={(e) => set("cookTime", Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Servings</Label>
          <Input
            type="number"
            min={1}
            value={data.servings}
            onChange={(e) => set("servings", Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Difficulty</Label>
          <Select value={data.difficulty} onValueChange={(v) => set("difficulty", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cuisine & calories */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Cuisine / Region</Label>
          <Input
            value={data.cuisine}
            onChange={(e) => set("cuisine", e.target.value)}
            placeholder="e.g. West African, Ethiopian"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Calories (optional)</Label>
          <Input
            value={data.calories}
            onChange={(e) => set("calories", e.target.value)}
            placeholder="e.g. 450 kcal per serving"
            className="mt-1"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <Label className="text-xs mb-2 block">Ingredients</Label>
        <div className="space-y-2">
          {data.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={ing.amount}
                onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="1 cup"
                className="w-24 shrink-0"
              />
              <Input
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="Tomatoes, chopped"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={data.ingredients.length === 1}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addIngredient}
          className="mt-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Ingredient
        </Button>
      </div>

      {/* Steps */}
      <div>
        <Label className="text-xs mb-2 block">Cooking Steps</Label>
        <div className="space-y-2">
          {data.steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-1.5">
                {s.step}
              </div>
              <textarea
                value={s.instruction}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Step ${s.step} instruction...`}
                rows={2}
                className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                disabled={data.steps.length === 1}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-30 mt-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addStep}
          className="mt-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Step
        </Button>
      </div>
    </div>
  );
}
