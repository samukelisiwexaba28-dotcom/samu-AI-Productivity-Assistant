const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type AICallOptions = {
  system: string;
  prompt: string;
  json?: boolean;
};

export class AIGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AIGatewayError";
  }
}

export async function callAI({ system, prompt, json }: AICallOptions): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new AIGatewayError(401, "AI is not configured for this workspace (missing API key).");
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body?.error?.message ?? body?.message ?? message;
    } catch {
      /* keep default message */
    }
    if (res.status === 429) {
      message = "The AI service is busy right now. Please wait a moment and try again.";
    }
    if (res.status === 402) {
      message = message || "AI credits are exhausted. The workspace owner needs to add credits.";
    }
    throw new AIGatewayError(res.status, message);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AIGatewayError(502, "The AI returned an empty response. Please try again.");
  }
  return text;
}

export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new AIGatewayError(502, "The AI response could not be read. Please try again.");
  }
}
