import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  let tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null = null;

  const result = streamText({
    model: openai("gpt-4o"),
    messages,    
  });
  return result.toDataStreamResponse();
}
