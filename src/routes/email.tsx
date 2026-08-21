import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AIDisclaimer, AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail, type EmailDraft } from "@/lib/ai.functions";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Flowdesk AI" },
      {
        name: "description",
        content:
          "Turn a short brief into a professional email draft with tone control, subject line options and sign-offs you can edit before sending.",
      },
      { property: "og:title", content: "Smart Email Generator | Flowdesk AI" },
      {
        property: "og:description",
        content: "Draft formal, friendly or persuasive work emails and edit them before sending.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive"] as const;

const EXAMPLE =
  "Tell a client the project will be delayed by one week, offer a revised delivery date, and reassure them about quality.";

function EmailPage() {
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState<EmailDraft | null>(null);

  const run = useServerFn(generateEmail);
  const mutation = useMutation({
    mutationFn: (input: {
      brief: string;
      tone: (typeof TONES)[number];
      recipient?: string | undefined;
      sender?: string | undefined;

    }) => run({ data: input }),

    onSuccess: (result) => {
      setDraft(result);
      setSubject(result.subjectLines[0] ?? "");
      setBody(result.body);
      toast.success("Draft ready — review before sending");
    },
    onError: (error: Error) => toast.error(error.message || "Could not generate the email"),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Draft copied to clipboard");
  };

  return (
    <AppShell>
      <PageHeading
        eyebrow="Smart Email Generator"
        title="Write the email in one line, refine the rest"
        description="Describe what you need to say and pick a tone. The draft is yours to edit — nothing is ever sent from here."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-sm font-semibold">Your brief</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="recipient">Recipient (optional)</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Thandi, Acme Ltd"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sender">Your name / role (optional)</Label>
                <Input
                  id="sender"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Sam, Project Lead"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief">What should the email say?</Label>
              <Textarea
                id="brief"
                rows={6}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={EXAMPLE}
              />
              <button
                type="button"
                onClick={() => setBrief(EXAMPLE)}
                className="text-xs font-medium text-primary underline"
              >
                Use example brief
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Tone</legend>
              <div className="flex flex-wrap gap-2">
                {TONES.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={tone === option ? "default" : "outline"}
                    size="sm"
                    aria-pressed={tone === option}
                    onClick={() => setTone(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </fieldset>

            <Button
              className="w-full"
              disabled={brief.trim().length < 5 || mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  brief: brief.trim(),
                  tone,
                  recipient: recipient.trim() || undefined,
                  sender: sender.trim() || undefined,
                })
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" /> Generate draft
                </>
              )}
            </Button>
          </div>
          <AIDisclaimer text="The AI does not know your project facts. Check dates, names and commitments before sending." />
        </section>

        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Editable draft</h2>
            {draft ? (
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="mr-1.5 size-3.5" /> Copy
              </Button>
            ) : null}
          </div>

          {!draft ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Your draft will appear here with subject line and sign-off suggestions.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {draft.subjectLines.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSubject(option)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  rows={16}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-medium">Sign-off suggestions</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {draft.signOffs.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBody((prev) => `${prev.trimEnd()}\n\n${option}`)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
