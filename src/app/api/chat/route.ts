import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2_000),
      }),
    )
    .min(1)
    .max(12),
});

const SYSTEM_PROMPT = `You are FlightOps Assistant, the helpful travel assistant on the FlightOps website.
Answer in the language used by the visitor (Bangla, Banglish, or English). Be concise, friendly, and practical.
You can help visitors discover flights, understand schedules, fares, baggage allowances, booking, and how to use FlightOps.
FlightOps primarily lists journeys from Dhaka (DAC). Available routes and live details must be checked on /flights.
Never invent live availability, prices, policies, booking confirmations, or flight status. Ask the visitor to open Explore Flights when current data is needed.
Never claim to complete a booking or payment. Direct booking questions to a flight's details page and its Book now action.
For account-specific or payment problems, direct the visitor to /contact. Do not request passwords, card details, passport numbers, API keys, or other secrets.`;

export async function POST(request: Request) {
  const apiKey = process.env.WALKAI_API_KEY;
  const model = process.env.WALKAI_MODEL;
  const baseUrl = (process.env.WALKAI_BASE_URL || "https://walkai.top/v1").replace(/\/$/, "");

  if (!apiKey || !model) {
    return NextResponse.json(
      { success: false, message: "AI assistant is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const { messages } = requestSchema.parse(await request.json());
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.35,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });

    if (!response.ok) {
      const upstreamMessage = await response.text();
      console.error("WalkAI request failed", response.status, upstreamMessage.slice(0, 500));
      return NextResponse.json(
        { success: false, message: "The AI assistant is temporarily unavailable." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    };
    const rawContent = data.choices?.[0]?.message?.content;
    const content = Array.isArray(rawContent)
      ? rawContent.map((part) => part.text || "").join("")
      : rawContent;

    if (!content?.trim()) {
      throw new Error("WalkAI returned an empty response");
    }

    return NextResponse.json({ success: true, data: { content: content.trim() } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Invalid message." },
        { status: 400 },
      );
    }
    console.error("Chat route error", error);
    return NextResponse.json(
      { success: false, message: "The AI assistant could not respond. Please try again." },
      { status: 500 },
    );
  }
}
