import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function AdminSubmissionsTab() {
  const submissions = useQuery(api.communitySubmissions.adminList);
  const review = useMutation(api.communitySubmissions.review);
  const [note, setNote] = useState("");
  const act = async (id: Id<"submissions">, decision: "approve" | "reject" | "return") => {
    try { await review({ id, decision, reviewNote: note.trim() || undefined }); setNote(""); toast.success(decision === "approve" ? "Submission published" : "Submission updated"); }
    catch { toast.error("Could not update submission"); }
  };
  if (!submissions) return <div className="p-6 text-muted-foreground">Loading submissions...</div>;
  if (!submissions.length) return <div className="p-10 text-center text-muted-foreground">No submissions awaiting review.</div>;
  return <div className="divide-y divide-border">{submissions.map((submission) => <div key={submission._id} className="p-5 space-y-3"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{submission.title}</h3><p className="text-sm text-muted-foreground">By {submission.authorName} · {submission.category}</p></div><Badge variant="secondary">Submitted</Badge></div><p className="text-sm text-muted-foreground">{submission.excerpt}</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note for the contributor" className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm" /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void act(submission._id, "approve")}><Check className="w-4 h-4 mr-1.5" />Publish</Button><Button size="sm" variant="secondary" onClick={() => void act(submission._id, "return")}><RotateCcw className="w-4 h-4 mr-1.5" />Return to author</Button><Button size="sm" variant="ghost" onClick={() => void act(submission._id, "reject")}><X className="w-4 h-4 mr-1.5" />Reject</Button></div></div>)}</div>;
}