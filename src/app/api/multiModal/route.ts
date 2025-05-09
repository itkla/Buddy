import { openai } from "@ai-sdk/openai";
// import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type Message } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  // pdf モデルを使用する場合
  // check if user has sent a PDF
  // const messagesHavePDF = messages.some((message) =>
  //   message.experimental_attachments?.some(
  //     (a) => a.contentType === "application/pdf"
  //   )
  // );
  // const result = streamText({
  //   model: messagesHavePDF
  //     ? anthropic("claude-3-5-sonnet-latest")
  //     : openai("gpt-4o"),
  //   messages,
  // });

  return result.toDataStreamResponse();
}
