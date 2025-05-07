import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h1 className="text-4xl font-bold mb-4">Hello AI</h1>
      <div className="flex items-center justify-center gap-2 *:border *:p-2 *:hover:bg-zinc-700">
        <Link href="/chatgpt">ChatGPT 4.5</Link>
        <Link href="/useObject">Use Object</Link>
        <Link href="/useAssistant">Use Assistant</Link>
      </div>
    </div>
  );
}