import { useState } from "react";
import { MessageSquarePlus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useListFeedback, useSubmitFeedback } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const FEEDBACK_STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  "in_progress": "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const demoFeedback = [
  { id: 1, type: "suggestion", subject: "Add more basket varieties", message: "Would love to see more coiled basket designs.", status: "open", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: 2, type: "compliment", subject: "Amazing packaging!", message: "The eco-friendly packaging was beautiful. Loved the handwritten note.", status: "resolved", createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() },
];

export default function CustomerFeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: feedbackData, refetch } = useListFeedback({ status: undefined });
  const submitFeedback = useSubmitFeedback();

  const [type, setType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const feedbackList = Array.isArray(feedbackData) ? feedbackData : demoFeedback;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    submitFeedback.mutate(
      { data: { type: type as any, subject, message } },
      {
        onSuccess: () => {
          toast({ title: "Feedback submitted! Thank you for helping us improve." });
          setSubmitted(true);
          setSubject("");
          setMessage("");
          setType("suggestion");
          refetch();
          setTimeout(() => setSubmitted(false), 3000);
        },
        onError: () => {
          toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold">Feedback</h1>
            <p className="text-sm text-muted-foreground mt-1">Share suggestions, compliments, or report issues.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Submit form */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-primary" /> Submit Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                    <p className="font-medium">Thank you for your feedback!</p>
                    <p className="text-sm text-muted-foreground mt-1">We'll review it shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="compliment">Compliment</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="bug_report">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary..." required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message</Label>
                      <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us more..." rows={4} required />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitFeedback.isPending}>
                      {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Past feedback */}
            <div>
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">Your Previous Feedback</h2>
              {feedbackList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No feedback submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackList.map((f: any) => (
                    <Card key={f.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-medium text-sm">{f.subject}</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs capitalize">{f.type?.replace("_", " ")}</Badge>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FEEDBACK_STATUS_COLORS[f.status] ?? "bg-muted text-muted-foreground"}`}>
                              {f.status === "in_progress" ? "In Progress" : f.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{f.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(f.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
