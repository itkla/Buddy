import Link from "next/link";

const featureList: {
  name: string;
  href: string;
  status: "coming soon" | "in progress" | "done";
}[] = [
  {
    name: "ChatGPT 4.5",
    href: "/chatgpt",
    status: "done",
  },
  {
    name: "Use Object",
    href: "/useObject",
    status: "done",
  },
  {
    name: "Reasoning",
    href: "/reasoning",
    status: "in progress",
  },
  {
    name: "Multi-Modal",
    href: "/multiModal",
    status: "coming soon",
  },
  {
    name: "Image Generation",
    href: "/image",
    status: "coming soon",
  },
  {
    name: "Multi-Agent",
    href: "/multiAgent",
    status: "coming soon",
  },
  {
    name: "PDF",
    href: "/pdf",
    status: "coming soon",
  },
  {
    name: "Generative UI",
    href: "/generativeUI",
    status: "coming soon",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <h1 className="text-4xl font-bold mb-4">Hello AI</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-center gap-2">
        {featureList.map((feature) => (
          <Link href={feature.href} key={feature.name} title={feature.status} className={`border p-2 text-center hover:bg-zinc-700 ${feature.status === "done" ? "" : "bg-zinc-800"}`}>
            {feature.name}
          </Link>
        ))}
      </div>
    </div>
  );
}