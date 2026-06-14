import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeakOps",
  description:
    "Agentic incident response for NCII leaks and urgent takedown workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
