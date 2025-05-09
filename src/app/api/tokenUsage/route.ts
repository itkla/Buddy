import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai("gpt-4.5-preview"),
    messages,
    // tool calling
    tools: {
      // tool example
      getWeather: tool({
        description: "Get the weather in a location",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10, // Random number (62 ~ 92)
        }),
      }),
      // openai web search tool
      web_search_preview: openai.tools.webSearchPreview(
        {
          // web search tool parameters
          searchContextSize: "medium", // low | medium | high
          userLocation: {
            type: "approximate",
            city: "Tokyo",
            region: "Tokyo",
            country: "Japan",
            timezone: "Asia/Tokyo",
          },
        }
      ),
    },
    maxSteps: 10,
  });
  return result.toDataStreamResponse();
}
