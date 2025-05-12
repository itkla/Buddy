import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import BackToHome from "@/components/common/BackToHome";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import ThemeToggle from "@/components/common/ThemeToggle";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Playground",
  description: "Testing playground for Vercel AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoSans.variable} ${robotoMono.variable} bg-zinc-950 text-zinc-50 antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* <ThemeToggle className="fixed top-2 left-2" /> */}
            <BackToHome className="fixed top-4 left-4 z-50" />
            {children}
            <ThemeToggle className="fixed bottom-4 right-4 z-50" />
          </ThemeProvider>
        </body>
    </html>
  );
}
