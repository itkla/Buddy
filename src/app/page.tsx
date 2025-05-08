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
    href: "/generateImage",
    status: "done",
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
      {/* Title */}
      <div className="flex flex-col items-center justify-center gap-2 mb-6 tracking-wider">
        <h1 className="text-4xl md:text-6xl font-bold text-white">Hello, AI!</h1>
        <h2 className="text-sm md:text-md font-normal text-zinc-500">Playground for Vercel AI SDK</h2>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div data-status="done" className="flex items-center gap-1">
          <div className="size-4 border bg-zinc-500"></div>
          <h6 className="text-sm text-zinc-500">Done</h6>
        </div>
        <div data-status="in progress" className="flex items-center gap-1">
          <div className="size-4 border bg-zinc-800"></div>
          <h6 className="text-sm text-zinc-500">In Progress</h6>
        </div>
        <div data-status="coming soon" className="flex items-center gap-1">
          <div className="size-4 border opacity-50"></div>
          <h6 className="text-sm text-zinc-500">Coming Soon</h6>
        </div>
      </div>

      {/* Feature List */}
      <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-center gap-2">
        {featureList.map((feature) => (
          <Link
            href={feature.href}
            key={feature.name}
            title={feature.status}
            data-status={feature.status}
            className={`border p-2 text-center hover:brightness-120
            ${feature.status === "coming soon" ? "opacity-50 pointer-events-none"
            : feature.status === "in progress" ? "bg-zinc-800"
            : "bg-zinc-500"}`}>
            {feature.name}
          </Link>
        ))}
      </div>
    </div>
  );
}