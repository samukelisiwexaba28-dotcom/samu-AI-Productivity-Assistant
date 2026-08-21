import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { callAI, parseJSON } from "./ai.server";

const EmailInput = z.object({
  brief: z.string().min(5).max(4000),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  recipient: z.string().max(200).optional(),
  sender: z.string().max(200).optional(),
});

export type EmailDraft = {
  subjectLines: string[];
  body: string;
  signOffs: string[];
};

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const raw = await callAI({
      json: true,
      system:
        "You are an expert business communication assistant. Write clear, respectful, culturally neutral workplace email drafts. Never invent facts, figures, names or commitments that were not provided: use short bracketed placeholders like [date] instead. Avoid stereotypes and loaded language. Return JSON only.",
      prompt: `Write a ${data.tone.toLowerCase()} professional email.

Recipient: ${data.recipient || "not specified"}
Sender: ${data.sender || "not specified"}
Purpose / brief: ${data.brief}

Return JSON with this exact shape:
{
  "subjectLines": ["3 concise subject line options"],
  "body": "the full email body including greeting and closing paragraph, plain text with \\n line breaks, no sign-off name block",
  "signOffs": ["3 suitable sign-off options matching the tone"]
}`,
    });

    const parsed = parseJSON<EmailDraft>(raw);
    return {
      subjectLines: (parsed.subjectLines ?? []).slice(0, 3),
      body: parsed.body ?? "",
      signOffs: (parsed.signOffs ?? []).slice(0, 3),
    };
  });

const NotesInput = z.object({
  transcript: z.string().min(20).max(20000),
});

export type MeetingSummary = {
  tldr: string;
  keyDiscussions: string[];
  decisions: string[];
  actionItems: Array<{ task: string; owner: string; due: string }>;
  followUps: string[];
};

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotesInput.parse(input))
  .handler(async ({ data }) => {
    const raw = await callAI({
      json: true,
      system:
        "You are a meticulous meeting analyst. Extract only what is explicitly present in the notes. If an owner or a date is not stated, use \"Unassigned\" or \"Not specified\" rather than guessing. Return JSON only.",
      prompt: `Summarize the following meeting notes, highlighting action items, decisions made, and deadlines.

Return JSON with this exact shape:
{
  "tldr": "3-4 sentence executive summary",
  "keyDiscussions": ["key discussion points"],
  "decisions": ["decisions made"],
  "actionItems": [{ "task": "...", "owner": "name or Unassigned", "due": "date or Not specified" }],
  "followUps": ["follow-up dates or next meetings"]
}

MEETING NOTES:
${data.transcript}`,
    });

    const parsed = parseJSON<MeetingSummary>(raw);
    return {
      tldr: parsed.tldr ?? "",
      keyDiscussions: parsed.keyDiscussions ?? [],
      decisions: parsed.decisions ?? [],
      actionItems: parsed.actionItems ?? [],
      followUps: parsed.followUps ?? [],
    };
  });

const PlannerInput = z.object({
  tasks: z.string().min(5).max(8000),
  horizon: z.enum(["Today", "This week"]),
  hoursPerDay: z.number().min(1).max(16),
});

export type PlannedTask = {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  effortHours: number;
  day: string;
  slot: string;
  rationale: string;
};

export type TaskPlan = {
  strategy: string;
  tasks: PlannedTask[];
};

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlannerInput.parse(input))
  .handler(async ({ data }) => {
    const raw = await callAI({
      json: true,
      system:
        "You are a pragmatic productivity planner. Classify priority from stated deadlines, urgency and importance, estimate effort in hours, and sequence work realistically (deep work early, admin later). Never exceed the stated capacity per day. Return JSON only.",
      prompt: `Build an optimized ${data.horizon === "Today" ? "daily" : "weekly"} schedule from this task list. Capacity: ${data.hoursPerDay} focused hours per day.

Return JSON with this exact shape:
{
  "strategy": "2-3 sentence explanation of how the plan was prioritized",
  "tasks": [
    {
      "title": "task name",
      "priority": "High | Medium | Low",
      "effortHours": 1.5,
      "day": "${data.horizon === "Today" ? "Today" : "Monday..Friday"}",
      "slot": "suggested time block e.g. 09:00-10:30",
      "rationale": "one short line on why it sits here"
    }
  ]
}

TASK LIST:
${data.tasks}`,
    });

    const parsed = parseJSON<{ strategy: string; tasks: Omit<PlannedTask, "id">[] }>(raw);
    return {
      strategy: parsed.strategy ?? "",
      tasks: (parsed.tasks ?? []).map((task, index) => ({
        id: `task-${index}`,
        title: task.title ?? "Untitled task",
        priority: (["High", "Medium", "Low"] as const).includes(task.priority)
          ? task.priority
          : "Medium",
        effortHours: Number(task.effortHours) || 1,
        day: task.day ?? "Today",
        slot: task.slot ?? "",
        rationale: task.rationale ?? "",
      })),
    } satisfies TaskPlan;
  });
