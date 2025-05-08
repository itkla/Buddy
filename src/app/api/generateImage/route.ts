import { streamText, tool, experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai("gpt-4.5-preview"),
    messages,
    // tool calling
    tools: {
      generateImage: tool({
        description: "Generate an image based on a prompt",
        parameters: z.object({
        prompt: z.string().describe("The prompt to generate an image for"),
      }),
      execute: async ({ prompt }) => {
        const image = await generateImage({
          model: openai.image("dall-e-3"),
          prompt,
          size: "1024x1024",
          providerOptions: {
            openai: {
              style: "vivid",
              quality: "standard",
            },
          },
        });
        const base64 = image.images[0].base64;
        // 画像保存用ディレクトリとファイル名を設定
        const dir = path.join(process.cwd(), "public", "generatedImage");
        const fileName = `image_${Date.now()}.webp`; // WebP形式に変更
        const filePath = path.join(dir, fileName);

        // ディレクトリがなければ作成
        await fs.mkdir(dir, { recursive: true });

        // base64をバッファに変換
        const buffer = Buffer.from(base64, "base64");

        // WebP形式に変換して圧縮
        await sharp(buffer)
          .webp({ quality: 80 }) // 品質を80%に設定
          .toFile(filePath);

        // クライアントに画像のパスを返す
        return { imagePath: `/generatedImage/${fileName}` };
        },
      }),
    },
    maxSteps: 10,
  });

  return result.toDataStreamResponse();
}
