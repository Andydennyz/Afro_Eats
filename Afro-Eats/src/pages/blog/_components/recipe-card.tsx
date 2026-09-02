import { Clock, Users, ChefHat, Flame, Printer } from "lucide-react";
import { motion } from "motion/react";

type RecipeData = {
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  ingredients: { amount: string; name: string }[];
  steps: { step: number; instruction: string }[];
  cuisine?: string;
  calories?: string;
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function RecipeCard({ data }: { data: RecipeData }) {
  const totalTime = data.prepTime + data.cookTime;

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-10 rounded-2xl border-2 border-primary/20 bg-card overflow-hidden print:border print:shadow-none"
    >
      {/* Header */}
      <div className="bg-primary/10 px-6 py-5 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl font-bold text-primary">Recipe Card</h2>
          {data.cuisine && (
            <span className="text-sm text-muted-foreground ml-1">· {data.cuisine}</span>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer print:hidden"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
        <div className="flex flex-col items-center gap-1 py-4 px-3 text-center">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Prep</span>
          <span className="font-bold text-sm">{data.prepTime} min</span>
        </div>
        <div className="flex flex-col items-center gap-1 py-4 px-3 text-center">
          <Flame className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Cook</span>
          <span className="font-bold text-sm">{data.cookTime} min</span>
        </div>
        <div className="flex flex-col items-center gap-1 py-4 px-3 text-center">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
          <span className="font-bold text-sm">{totalTime} min</span>
        </div>
        <div className="flex flex-col items-center gap-1 py-4 px-3 text-center">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Serves</span>
          <span className="font-bold text-sm">{data.servings}</span>
        </div>
      </div>

      {/* Difficulty + calories */}
      <div className="flex items-center gap-3 px-6 py-3 bg-muted/30 border-b border-border text-sm">
        <span className="text-muted-foreground">Difficulty:</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLOR[data.difficulty] ?? DIFFICULTY_COLOR.Medium}`}>
          {data.difficulty}
        </span>
        {data.calories && (
          <>
            <span className="text-muted-foreground ml-2">Calories:</span>
            <span className="font-medium">{data.calories}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Ingredients */}
        <div className="md:col-span-2 p-6">
          <h3 className="font-serif font-bold text-lg mb-4">Ingredients</h3>
          <ul className="space-y-2.5">
            {data.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>
                  <span className="font-semibold text-primary">{ing.amount}</span>{" "}
                  <span>{ing.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="md:col-span-3 p-6">
          <h3 className="font-serif font-bold text-lg mb-4">Instructions</h3>
          <ol className="space-y-4">
            {data.steps.map((s) => (
              <li key={s.step} className="flex gap-4 text-sm">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {s.step}
                </div>
                <p className="leading-relaxed pt-0.5">{s.instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.div>
  );
}
