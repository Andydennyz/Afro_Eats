import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Download, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type SearchResult = { id: string; title: string; area: string; category: string; image: string };

export default function FoodDbImportTab() {
  const searchMeals = useAction(api.foodDb.searchMeals);
  const importMeal = useAction(api.foodDb.importMeal);
  const retryImport = useAction(api.foodDb.retryImport);
  const failedImports = useQuery(api.foodDb.listFailedImports);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await searchMeals({ query: query.trim() }));
    } catch {
      toast.error("Could not search Food DB. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const importRecipe = async (mealId: string, status: "draft" | "published") => {
    setImportingId(mealId);
    try {
      const result = await importMeal({ mealId, status });
      toast.success(result.operation === "updated" ? "Recipe refreshed" : "Recipe imported");
    } catch {
      toast.error("Could not import this Food DB recipe.");
    } finally {
      setImportingId(null);
    }
  };

  const retry = async (externalId: string) => {
    setImportingId(externalId);
    try { await retryImport({ externalId, status: "draft" }); toast.success("Import retried"); }
    catch { toast.error("Retry failed. Check the import log."); }
    finally { setImportingId(null); }
  };

  return (
    <div className="space-y-6 p-5">
      <div>
        <h2 className="font-serif text-lg font-bold">Import Food DB recipes</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Search TheMealDB, then import a recipe as a draft for editorial review or publish it now.
          Imported recipes remain Afro Eats posts, so readers can like, save, and comment on them.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for jollof, chicken, plantain..."
          aria-label="Search Food DB recipes"
        />
        <Button type="submit" disabled={searching} className="cursor-pointer">
          <Search className="mr-2 size-4" />
          {searching ? "Searching" : "Search"}
        </Button>
      </form>

      {failedImports && failedImports.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="font-semibold">Failed imports</h3>
          <div className="mt-3 space-y-2">{failedImports.map((record) => <div key={record._id} className="flex items-center justify-between gap-3 text-sm"><div><span className="font-medium">Meal {record.externalId}</span><p className="text-xs text-muted-foreground">{record.errorMessage} · {record.attemptCount ?? 1} attempt(s)</p></div><Button size="sm" variant="secondary" disabled={importingId === record.externalId} onClick={() => void retry(record.externalId)}><RotateCcw className="mr-1.5 size-3.5" />Retry</Button></div>)}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((meal) => (
            <article key={meal.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {meal.image && <img src={meal.image} alt={meal.title} className="h-40 w-full object-cover" />}
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold">{meal.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {meal.area && <Badge variant="secondary">{meal.area}</Badge>}
                    {meal.category && <Badge variant="secondary">{meal.category}</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={importingId === meal.id} onClick={() => importRecipe(meal.id, "draft")} className="cursor-pointer">
                    <Download className="mr-1.5 size-3.5" /> Save draft
                  </Button>
                  <Button size="sm" disabled={importingId === meal.id} onClick={() => importRecipe(meal.id, "published")} className="cursor-pointer">
                    {importingId === meal.id ? "Importing" : "Publish now"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!searching && query && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Search Food DB to see importable recipes.</p>
      )}
    </div>
  );
}
