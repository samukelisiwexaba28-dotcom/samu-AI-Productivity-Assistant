import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AIDisclaimer, AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai.functions";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Flowdesk AI" },
      {
        name: "description",
        content:
          "Paste meeting notes or a transcript and get a TL;DR, decisions, action items with owners, deadlines and follow-ups you can export.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Flowdesk AI" },
      {
        property: "og:description",
        content: "Turn long meeting transcripts into shareable summaries and action items.",
      },
    ],
  }),
  component: NotesPage,
});

const EXAMPLE = `Weekly product sync — 14 Aug
Nomvula walked through the onboarding drop-off: 38% of users abandon at step 3.
Sipho suggested trimming the form to three fields; team agreed to test it.
Decision: ship the shortened form behind a flag before the 29 Aug release.
Nomvula to prepare the experiment brief by Friday. Sipho to update the tracking plan by 20 Aug.
Design review of the new empty states pushed to next Tuesday's session.`;

function toMarkdown(summary: MeetingSummary) {
  const lines = [
    "# Meeting summary",
    "",
    "## TL;DR",
    summary.tldr,
    "",
    "## Key discussions",
    ...summary.keyDiscussions.map((item) => `- ${item}`),
    "",
    "## Decisions",
    ...summary.decisions.map((item) => `- ${item}`),
    "",
    "## Action items",
    ...summary.actionItems.map((item) => `- ${item.task} — ${item.owner} (due: ${item.due})`),
    "",
    "## Follow-ups",
    ...summary.followUps.map((item) => `- ${item}`),
    "",
    "_AI-generated summary. Verify before sharing externally._",
  ];
  return lines.join("\n");
}

function NotesPage() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);

  const run = useServerFn(summarizeMeeting);
  const mutation = useMutation({
    mutationFn: (input: { transcript: string }) => run({ data: input }),
    onSuccess: (result) => {
      setSummary(result);
      toast.success("Summary ready — check owners and dates");
    },
    onError: (error: Error) => toast.error(error.message || "Could not summarize the notes"),
  });

  const copy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(toMarkdown(summary));
    toast.success("Summary copied as Markdown");
  };

  const download = () => {
    if (!summary) return;
    const blob = new Blob([toMarkdown(summary)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meeting-summary.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeading
        eyebrow="Meeting Notes Summarizer"
        title="From a wall of notes to a shareable summary"
        description="Paste raw notes or a transcript. The AI extracts the TL;DR, decisions, action items with owners, and deadlines."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="space-y-1.5">
            <Label htmlFor="transcript">Meeting notes or transcript</Label>
            <Textarea
              id="transcript"
              rows={18}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your notes here…"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setTranscript(EXAMPLE)}
                className="text-xs font-medium text-primary underline"
              >
                Load example notes
              </button>
              <span className="text-xs text-muted-foreground">{transcript.length} characters</span>
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={transcript.trim().length < 20 || mutation.isPending}
            onClick={() => mutation.mutate({ transcript: transcript.trim() })}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Summarizing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Summarize meeting
              </>
            )}
          </Button>

          <AIDisclaimer text="Owners and dates are only extracted when stated in the notes. Anything unclear is marked unassigned — confirm with attendees." />
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Summary</h2>
            {summary ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="mr-1.5 size-3.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="mr-1.5 size-3.5" /> Export
                </Button>
              </div>
            ) : null}
          </div>

          {!summary ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Your TL;DR, decisions, action items and deadlines will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-5 text-sm">
              <div className="rounded-lg bg-accent/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                  TL;DR
                </p>
                <p className="mt-1.5 text-accent-foreground">{summary.tldr}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Key discussions</h3>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  {summary.keyDiscussions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Decisions made</h3>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  {summary.decisions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Action items</h3>
                <ul className="mt-2 space-y-2">
                  {summary.actionItems.map((item) => (
                    <li
                      key={`${item.task}-${item.owner}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="font-medium">{item.task}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Owner: {item.owner} · Due: {item.due}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Follow-ups</h3>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  {summary.followUps.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
