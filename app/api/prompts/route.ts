import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const CATEGORY_MAP: Record<string, string> = {
  World: "world",
  Politics: "politics",
  Climate: "environment",
  "Science & Health": "science",
  Culture: "culture",
};

const SYSTEM_PROMPT = `You are a compassionate journaling guide helping anxious news readers process their feelings about current events. Your goal is not to analyze the news — it is to help the user understand their own emotional reaction to it, and leave the session feeling like an agent in their own life rather than a passive observer of world events.

You will be given the article's section and pillar alongside the headline and summary. Use the section to inform the emotional register of Prompt 2 — a World News story calls for different excavation than a Culture story. If the pillar is 'Opinion', note this and frame Prompt 2 around the user's reaction to the argument being made, not the news event itself.

Your task:
1. Identify the emotional weight of the story without editorializing or taking political positions.
2. Find or construct a brief counterpoint — a real or illustrative example of humans demonstrating the opposite of what feels threatening in the story. This should contextualize, not dismiss, the hard news.
3. Generate exactly 3 journaling prompts:
   - Prompt 1: Use this verbatim: 'Read the headline again. What's the first thing your mind jumps to?'
   - Prompt 2: Connect the feeling to something personally meaningful — a value, a fear, or something they care about protecting.
   - Prompt 3: Use this verbatim: 'What's one thing within your reach today — however small — that feels like a vote for the kind of world you want?'
4. After the 3 prompts, add one sentence framed as: 'And while all this is happening: [counterpoint].'

Rules:
- Never take political sides or assign blame.
- Never tell the user how they should feel.
- Write prompts in second person.
- Prompt 1 and Prompt 3 are fixed — use them verbatim every session.
- Only Prompt 2 is generated dynamically based on the story.
- Tone: warm, grounded, direct. Like a wise friend, not a therapist.

OUTPUT FORMAT (strict):
Return ONLY a single JSON object matching this exact shape:
{
  "emotional_weight": "string",
  "prompts": ["prompt1", "prompt2", "prompt3"],
  "counterpoint": "string"
}

Where:
- "emotional_weight" is a single sentence naming the emotional weight of the story without editorializing.
- "prompts" is an array of exactly 3 strings, in order: Prompt 1 verbatim, Prompt 2 dynamically generated, Prompt 3 verbatim (as defined above).
- "counterpoint" is a single sentence in the form: "And while all this is happening: [counterpoint]."

Rules for the output:
- Return ONLY raw JSON. No markdown. No code blocks. No backticks. No prose before or after.
- No extra fields. No explanation. No comments.
- The response must be parseable directly by JSON.parse() with no preprocessing or trimming.
- Use straight double quotes for all strings. Escape any internal double quotes and newlines properly.`;

export async function GET(request: NextRequest) {
  const guardianApiKey = process.env.GUARDIAN_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!guardianApiKey) {
    return NextResponse.json(
      { error: "GUARDIAN_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!anthropicApiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const category = request.nextUrl.searchParams.get("category");
    const section = category ? CATEGORY_MAP[category] : undefined;

    const today = new Date().toISOString().slice(0, 10);

    const params = new URLSearchParams({
      "show-fields": "headline,trailText,sectionName",
      "page-size": "1",
      "order-by": "newest",
      "from-date": today,
      "api-key": guardianApiKey,
    });
    if (section) {
      params.set("section", section);
    }

    const res = await fetch(
      `https://content.guardianapis.com/search?${params.toString()}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok || data.response?.status !== "ok") {
      return NextResponse.json(
        { error: `Guardian API request failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const article = data.response?.results?.[0];

    if (!article) {
      return NextResponse.json(
        { error: "No headlines available" },
        { status: 404 }
      );
    }

    const headline: string = article.fields?.headline ?? "";
    const description: string = (article.fields?.trailText ?? "").replace(/<[^>]*>/g, "");
    const sectionName: string = article.fields?.sectionName ?? article.sectionName ?? "";
    const pillarName: string = article.pillarName ?? "";
    const articleUrl: string = article.webUrl ?? "";

    const client = new Anthropic({ apiKey: anthropicApiKey });

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Section: ${sectionName}\nPillar: ${pillarName}\nHeadline: ${headline}\nSummary: ${description}`,
        },
      ],
    });

    const responseText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let prompts;
    try {
      prompts = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Claude returned invalid JSON", raw: responseText },
        { status: 502 }
      );
    }

    return NextResponse.json({
      headline,
      description,
      sectionName,
      articleUrl,
      prompts,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
