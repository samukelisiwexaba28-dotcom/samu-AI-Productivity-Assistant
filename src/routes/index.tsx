import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Mail, NotebookPen, ShieldCheck, ArrowRight } from "lucide-react";

import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowdesk AI — AI Productivity Dashboard for Work" },
      {
        name: "description",
        content:
          "One workspace to draft professional emails, summarize meeting notes into action items, and build an AI-prioritized daily schedule.",
      },
      { property: "og:title", content: "Flowdesk AI — AI Productivity Dashboard" },
      {
        property: "og:description",
        content:
          "Draft emails, summarize meetings and plan your day with AI — always with a human in the loop.",
      },
    ],
  }),
  component: Index,
});

const TOOLS = [
  {
    to: "/email" as const,
    icon: Mail,
    title: "Smart Email Generator",
    description:
      "Turn a one-line brief into a polished email with tone control, subject line options and sign-offs.",
    tag: "Formal · Friendly · Persuasive",
  },
  {
    to: "/notes" as const,
    icon: NotebookPen,
    title: "Meeting Notes Summarizer",
    description:
      "Paste a transcript and get a TL;DR, decisions, owners, deadlines and follow-ups you can share.",
    tag: "TL;DR · Actions · Deadlines",
  },
  {
    to: "/planner" as const,
    icon: CalendarClock,
    title: "AI Task Planner",
    description:
      "Prioritize by deadline, effort and importance, then reorder your schedule by dragging tasks.",
    tag: "Priority · Effort · Schedule",
  },
];

function Index() {
  return (
    <AppShell>
      <section className="hero-gradient mb-8 overflow-hidden rounded-2xl px-6 py-10 text-primary-foreground sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
          Workplace AI, responsibly applied
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
          Spend less time drafting, summarizing and re-planning your day
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85">
          Three focused AI tools in one dashboard. Every draft stays editable, nothing is sent
          automatically, and you always review before anything leaves your hands.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/email">
              Draft an email <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link to="/planner">Plan my week</Link>
          </Button>
        </div>
      </section>

      <PageHeading
        eyebrow="Your toolkit"
        title="Pick a tool to get started"
        description="Each tool uses a purpose-built prompt so the output is specific, structured and easy to edit."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, title, description, tag }) => (
          <Link key={to} to={to} className="panel group block p-5 transition-shadow hover:shadow-lg">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary">{tag}</p>
          </Link>
        ))}
      </div>

      <div className="panel mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold">Human in the loop, by design</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Learn how the AI works, where it can go wrong, and how your input is handled.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/responsible-ai">Responsible AI &amp; help</Link>
        </Button>
      </div>
    </AppShell>
  );
}
