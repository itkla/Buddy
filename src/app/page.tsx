import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h1 className="text-4xl font-bold">Hello AI</h1>
      <ul className="flex items-center justify-center gap-2 *:border *:p-2">
        <li>
          <Link href="/chatgpt">ChatGPT 4.5</Link>
        </li>
        <li>
          <Link href="/useObject">Use Object</Link>
        </li>
      </ul>
    </div>
  );
}