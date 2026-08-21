import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Clock, GripVertical, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AIDisclaimer, AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { planTasks, type PlannedTask } from "@/lib/ai.functions";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler | Flowdesk AI" },
      {
        name: "description",
        content:
          "Paste your task list and get an AI-prioritized daily or weekly schedule with effort estimates, drag-and-drop reordering and progress tracking.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler | Flowdesk AI" },
      {
        property: "og:description",
        content: "Prioritize by deadline, effort and importance, then reorder your plan by hand.",
      },
    ],
  }),
  component: PlannerPage,
});

const HORIZONS = ["Today", "This week"] as const;

const EXAMPLE = `Finish Q3 budget review — due Wednesday, high stakes
Reply to supplier quotes — 30 min
Draft onboarding experiment brief — due Friday
Prepare slides for Monday leadership sync
Book venue for team offsite — no deadline yet
Fix reporting bug flagged by support — blocking two clients`;

const PRIORITY_STYLES: Record<PlannedTask["priority"], string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/20 text-warning-foreground",
  Low: "bg-success/15 text-success",
};

function PlannerPage() {
  const [tasksInput, setTasksInput] = useState("");
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>("Today");
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [strategy, setStrategy] = useState("");
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);

  const run = useServerFn(planTasks);
  const mutation = useMutation({
    mutationFn: (input: {
      tasks: string;
      horizon: (typeof HORIZONS)[number];
      hoursPerDay: number;
    }) => run({ data: input }),
    onSuccess: (result) => {
      setStrategy(result.strategy);
      setTasks(result.tasks);
      setDone({});
      toast.success("Schedule ready — drag to adjust");
    },
    onError: (error: Error) => toast.error(error.message || "Could not build the plan"),
  });

  const completed = tasks.filter((task) => done[task.id]).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const totalHours = useMemo(
    () => tasks.reduce((sum, task) => sum + task.effortHours, 0),
    [tasks],
  );

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setTasks((prev) => {
      const next = [...prev];
      const from = next.findIndex((task) => task.id === dragId);
      const to = next.findIndex((task) => task.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      if (moved) next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  };

  return (
    <AppShell>
      <PageHeading
        eyebrow="AI Task Planner"
        title="Let the AI sequence your day, then adjust it yourself"
        description="Priorities come from stated deadlines, effort and importance. Drag any task to a new position — the plan is yours."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section className="panel p-5">
          <div className="space-y-1.5">
            <Label htmlFor="tasks">Task list (one per line)</Label>
            <Textarea
              id="tasks"
              rows={12}
              value={tasksInput}
              onChange={(e) => setTasksInput(e.target.value)}
              placeholder={"Task — deadline, effort or importance\nAnother task…"}
            />
            <button
              type="button"
              onClick={() => setTasksInput(EXAMPLE)}
              className="text-xs font-medium text-primary underline"
            >
              Load example tasks
            </button>
          </div>

          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm font-medium">Plan for</legend>
            <div className="flex gap-2">
              {HORIZONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={horizon === option ? "default" : "outline"}
                  size="sm"
                  aria-pressed={horizon === option}
                  onClick={() => setHorizon(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="hours">Focused hours available per day</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={16}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value) || 1)}
            />
          </div>

          <Button
            className="mt-4 w-full"
            disabled={tasksInput.trim().length < 5 || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                tasks: tasksInput.trim(),
                horizon,
                hoursPerDay: Math.min(16, Math.max(1, hoursPerDay)),
              })
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Planning…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Build my schedule
              </>
            )}
          </Button>

          <AIDisclaimer text="Effort estimates are approximations. Nothing is added to your calendar — you decide what to commit to." />
        </section>

        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Your schedule</h2>
            {tasks.length ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {totalHours.toFixed(1)} h planned
              </span>
            ) : null}
          </div>

          {!tasks.length ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Your prioritized, time-blocked plan will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {strategy ? (
                <p className="rounded-lg bg-accent/60 p-3 text-sm text-accent-foreground">
                  {strategy}
                </p>
              ) : null}

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {completed} of {tasks.length} complete
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="mt-1.5" />
              </div>

              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(task.id)}
                    className={`flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-opacity ${
                      dragId === task.id ? "opacity-50" : ""
                    }`}
                  >
                    <GripVertical
                      className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Checkbox
                      id={task.id}
                      checked={Boolean(done[task.id])}
                      onCheckedChange={(value) =>
                        setDone((prev) => ({ ...prev, [task.id]: Boolean(value) }))
                      }
                      aria-label={`Mark ${task.title} complete`}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label
                          htmlFor={task.id}
                          className={`text-sm font-medium ${
                            done[task.id] ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {task.title}
                        </Label>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.day}
                        {task.slot ? ` · ${task.slot}` : ""} · ~{task.effortHours}h
                      </p>
                      {task.rationale ? (
                        <p className="mt-1 text-xs text-muted-foreground">{task.rationale}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
