import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Mail, Send, Users } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { format } from "date-fns";

import type { Doc } from "@/convex/_generated/dataModel.d.ts";

export default function AdminSubscribersTab() {
  const subscribers = useQuery(api.subscribers.adminList);
  const sendBroadcast = useAction(api.emails.sendBroadcast);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    try {
      const result = await sendBroadcast({ subject: subject.trim(), body: body.trim() });
      toast.success(`Broadcast sent to ${result.sent} subscriber${result.sent === 1 ? "" : "s"}!`);
      setBroadcastOpen(false);
      setSubject("");
      setBody("");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to send broadcast. Make sure your sender email is verified.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {subscribers === undefined ? "Loading..." : `${subscribers.length} active subscriber${subscribers.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setBroadcastOpen(true)}
          disabled={!subscribers || subscribers.length === 0}
          className="cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          Send Broadcast
        </Button>
      </div>

      {subscribers === undefined ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No subscribers yet</p>
          <p className="text-sm mt-1">Once readers subscribe via the newsletter form, they'll appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {subscribers.map((sub: Doc<"subscribers">, i: number) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{sub.email}</p>
                <p className="text-xs text-muted-foreground">
                  Subscribed {format(new Date(sub.subscribedAt), "MMM d, yyyy")}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Send Newsletter Broadcast</DialogTitle>
            <DialogDescription>
              This will send an email to all {subscribers?.length ?? 0} active subscriber{(subscribers?.length ?? 0) === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your monthly Afro Eats digest"
                disabled={sending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message to subscribers..."
                rows={6}
                disabled={sending}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBroadcastOpen(false)}
                disabled={sending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending} className="cursor-pointer">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {sending ? "Sending..." : "Send Broadcast"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
