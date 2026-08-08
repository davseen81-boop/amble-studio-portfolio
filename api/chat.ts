/**
 * DynamiX Daily — assistant endpoint
 * ==================================
 *
 * A Vercel serverless function that proxies the dashboard's chat panel to
 * Claude. Its only real job is to hold the Anthropic API key, which cannot
 * live in a static page.
 *
 * The function is deliberately stateless: the dashboard owns the conversation
 * and the task data, and sends both on every turn. Nothing about David's
 * routines, calendar, or mail is stored here.
 *
 * Environment (Vercel project settings):
 *   ANTHROPIC_API_KEY   required
 *   DASHBOARD_SHARED_KEY  optional. When set, requests must carry the same
 *                         value or they are rejected — worth setting, since
 *                         the endpoint is otherwise open to anyone who finds
 *                         the URL and would bill your key.
 */

import Anthropic from "@anthropic-ai/sdk";

export const config = { runtime: "nodejs" };

const MODEL = "claude-opus-5";

/** Reject oversized payloads before they reach the model. */
const MAX_MESSAGES = 40;
const MAX_TASKS = 200;

/**
 * Write tools. These execute in the browser against local storage — the
 * function never touches the user's data, it only relays the model's intent.
 * The dashboard applies them and posts the results back for the next turn.
 */
const TOOLS: Anthropic.Tool[] = [
  {
    name: "complete_routine",
    description:
      "Mark a routine as done for a given date. Use when the user says they have finished something. " +
      "Only use ids that appear in the routine list you were given.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The routine's id." },
        date: {
          type: "string",
          description: "Date to mark, as YYYY-MM-DD. Defaults to today when omitted.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "add_routine",
    description:
      "Create a new routine. Use when the user asks to start tracking something. " +
      "Ask for the schedule if they have not made it clear.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "What needs doing." },
        notes: { type: "string", description: "Optional supporting detail." },
        freq: {
          type: "string",
          enum: ["daily", "weekdays", "weekly", "monthly", "once"],
          description: "How often it repeats.",
        },
        time: { type: "string", description: "Optional time of day as HH:MM, 24-hour." },
        days: {
          type: "array",
          items: { type: "integer" },
          description: "For freq=weekly: weekday numbers, 0 = Sunday through 6 = Saturday.",
        },
        dom: { type: "integer", description: "For freq=monthly: day of the month, 1-31." },
        date: { type: "string", description: "For freq=once: the date as YYYY-MM-DD." },
      },
      required: ["title", "freq"],
    },
  },
  {
    name: "log_activity",
    description:
      "Record something that happened, in the day's activity log. Use when the user reports what " +
      "they did, who they saw, or what came out of a meeting — anything worth having a record of " +
      "later. This is a diary entry, not a routine: do not use it to tick a routine off.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "What happened, in the user's own words where possible." },
        date: {
          type: "string",
          description: "Date to file it under, as YYYY-MM-DD. Defaults to the day being viewed.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "archive_routine",
    description: "Archive a routine so it stops appearing. Use when the user no longer wants to track it.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string", description: "The routine's id." } },
      required: ["id"],
    },
  },
];

function systemPrompt(ctx: DashboardContext): string {
  return [
    "You are the assistant inside DynamiX Daily, David Seen's private routine dashboard.",
    "David founded and leads DynamiX Group, a Singapore wealth advisory firm. You are speaking to him directly, not to a client.",
    "",
    "## What you can see",
    "Every turn you receive the full current state of his routines, plus the activity log for the day he is looking at.",
    "Answer from that directly. Never invent a routine, a streak, a completion, or an activity entry that is not in the data below.",
    "The activity log is his record of what actually happened — meetings, calls, decisions. Routines are what he intended to do. Keep the two straight.",
    "",
    "## How to answer",
    "Lead with the answer. If he asks what is outstanding, list what is outstanding — do not restate the question or narrate what you are about to do.",
    "Keep replies short. Two or three sentences for most questions; a tight list when a list is genuinely the answer.",
    "Replies may be read aloud, so write them to be heard: plain sentences, no markdown, no bullet characters, no emoji.",
    "Use his own wording for routines rather than paraphrasing them.",
    "When something has been missed repeatedly, say so plainly and without moralising. He can see the numbers; he does not need a lecture.",
    "",
    "## Acting on his behalf",
    "You can mark routines done, add new ones, archive ones he has finished with, and log activity.",
    "Do those when he asks. Do not mark anything done on your own initiative, and do not add a routine he only mentioned in passing.",
    "When he tells you what he did — a meeting, a call, an outcome — log it with log_activity, in his own words, without being asked. That is the point of the log.",
    "Much of what reaches you is dictated, so expect transcription noise: fix obvious mis-hearings, and never read punctuation aloud back to him.",
    "If a request is ambiguous about the schedule, ask one short question rather than guessing.",
    "",
    "## Scope",
    "You see routines only. You have no access to his inbox, his calendar beyond what has synced into these routines, his clients, or any firm data.",
    "If he asks for something you cannot see, say so in a sentence and tell him where it lives.",
    "Do not give financial, regulatory, or compliance advice, even hypothetically — that is his profession, not yours, and MAS rules govern it.",
    "",
    "## Current state",
    `Today is ${ctx.today} (${ctx.weekday}). Local time ${ctx.localTime}, timezone ${ctx.timezone}.`,
    ctx.viewingDate && ctx.viewingDate !== ctx.today
      ? `He is currently looking at ${ctx.viewingDate}, not today. Answer about that day unless he says otherwise.`
      : "",
    "",
    "Routines, as JSON:",
    JSON.stringify(ctx.routines, null, 1),
    "",
    `Activity logged on ${ctx.viewingDate || ctx.today}, as JSON:`,
    JSON.stringify(ctx.activity || [], null, 1),
  ].join("\n");
}

interface DashboardContext {
  today: string;
  weekday: string;
  localTime: string;
  timezone: string;
  viewingDate?: string;
  routines: unknown[];
  activity?: unknown[];
}

function bad(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return bad(res, 405, "POST only.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return bad(res, 500, "ANTHROPIC_API_KEY is not configured on the server.");

  const sharedKey = process.env.DASHBOARD_SHARED_KEY;
  if (sharedKey && req.headers["x-dashboard-key"] !== sharedKey) {
    return bad(res, 401, "Unauthorised.");
  }

  const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) ?? {};
  const messages = body.messages;
  const context = body.context;

  if (!Array.isArray(messages) || messages.length === 0) {
    return bad(res, 400, "messages must be a non-empty array.");
  }
  if (messages.length > MAX_MESSAGES) {
    return bad(res, 400, `Conversation too long — send at most ${MAX_MESSAGES} messages.`);
  }
  if (!context || !Array.isArray(context.routines)) {
    return bad(res, 400, "context.routines is required.");
  }
  if (context.routines.length > MAX_TASKS) {
    return bad(res, 400, `Too many routines — send at most ${MAX_TASKS}.`);
  }

  const client = new Anthropic({ apiKey });

  // Server-sent events, so the reply appears as it is written rather than
  // after a long silence. Thinking is on by default on this model, which can
  // mean several seconds before the first token — streaming hides that.
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      // Routine lookups don't need deep reasoning, and low effort keeps the
      // dashboard feeling responsive.
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: systemPrompt(context as DashboardContext),
        },
      ],
      tools: TOOLS,
      messages: messages as Anthropic.MessageParam[],
    });

    stream.on("text", (delta) => send("text", { text: delta }));

    const final = await stream.finalMessage();

    // A refusal arrives as a normal 200 with empty or partial content, so it
    // has to be checked before the content is read.
    if (final.stop_reason === "refusal") {
      send("error", { message: "That request was declined. Try rephrasing it." });
      send("done", { stop_reason: "refusal" });
      return res.end();
    }

    // Tool calls run in the browser, so hand them back rather than executing
    // here. The dashboard applies them and posts the results for the next turn.
    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    send("done", {
      stop_reason: final.stop_reason,
      content: final.content,
      tool_uses: toolUses.map((t) => ({ id: t.id, name: t.name, input: t.input })),
    });
    res.end();
  } catch (err) {
    const message =
      err instanceof Anthropic.RateLimitError
        ? "Rate limited — try again in a moment."
        : err instanceof Anthropic.AuthenticationError
          ? "The server's API key was rejected."
          : err instanceof Anthropic.APIError
            ? `Claude API error (${err.status}).`
            : "Something went wrong talking to Claude.";

    console.error("chat handler failed:", err);

    // Headers are already sent by this point, so the error has to go down the
    // stream rather than as a status code.
    send("error", { message });
    send("done", { stop_reason: "error" });
    res.end();
  }
}

/* Minimal shapes for Vercel's request/response, so this file needs no extra
   dependency beyond the Anthropic SDK. */
interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
  write(chunk: string): void;
  end(): void;
}
