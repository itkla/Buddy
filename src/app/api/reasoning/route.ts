import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("o3-mini"),
    messages,
    providerOptions: {
      openai: {
        reasoningEffort: "low",
      },
    },
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
