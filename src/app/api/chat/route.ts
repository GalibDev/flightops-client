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

const OFFLINE_HELP = "I'm temporarily in offline help mode. I can still help with finding flights, booking steps, baggage, payments, login, and contacting support.";

function offlineAnswer(message: string) {
  const text = message.toLowerCase();
  if (/book|booking|reserve|ticket|বুক/.test(text)) {
    return "To book a flight: open Explore Flights, choose a flight, select View details, then click Book now. Log in, enter the passenger and seat details, and continue to secure Stripe checkout.";
  }
  if (/baggage|luggage|bag|ব্যাগ|লাগেজ/.test(text)) {
    return "Baggage allowance is shown on each flight's details page because it can vary by flight. Open Explore Flights, select a flight, and check the Baggage allowance section before booking.";
  }
  if (/find|search|flight|dhaka|dubai|route|ফ্লাইট|ঢাকা/.test(text)) {
    return "Open Explore Flights to see current routes from Dhaka. You can search by destination and filter by airline, travel class, and price. Open a flight card to confirm its schedule, fare, and available seats.";
  }
  if (/pay|payment|stripe|card|পেমেন্ট/.test(text)) {
    return "FlightOps uses secure Stripe Checkout for payments. Choose a flight and complete the booking form to continue to payment. For a payment problem, please use the Contact page—never share card details in chat.";
  }
  if (/login|log in|register|account|sign up|লগইন/.test(text)) {
    return "Use Login if you already have an account, or Sign up to create one. You need to be logged in to book a flight and access your dashboard.";
  }
  if (/contact|support|help|যোগাযোগ/.test(text)) {
    return "Open the Contact page from the navigation menu to send a message to the FlightOps support team. For account or payment issues, include a short description but never send passwords or card details.";
  }
  return OFFLINE_HELP;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROK_API_KEY;
  const model = process.env.GROK_MODEL || "grok-4.5";
  const baseUrl = (process.env.GROK_BASE_URL || "https://walkai.top/v1").replace(/\/$/, "");

  try {
    const { messages } = requestSchema.parse(await request.json());
    const latestMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
    const preparedAnswer = offlineAnswer(latestMessage);

    if (preparedAnswer !== OFFLINE_HELP) {
      return NextResponse.json({ success: true, data: { content: preparedAnswer, offline: true } });
    }

    if (!apiKey) {
      return NextResponse.json({ success: true, data: { content: preparedAnswer, offline: true } });
    }

    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: messages,
        temperature: 0.35,
        max_output_tokens: 500,
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });

    if (!response.ok) {
      const upstreamMessage = await response.text();
      console.error("WalkAI request failed", response.status, upstreamMessage.slice(0, 500));
      return NextResponse.json({ success: true, data: { content: preparedAnswer, offline: true } });
    }

    const data = (await response.json()) as {
      output?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const content = data.output
      ?.filter((item) => item.type === "message")
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text || "")
      .join("");

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
    return NextResponse.json({ success: true, data: { content: OFFLINE_HELP, offline: true } });
  }
}
