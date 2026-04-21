import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "微纪元 · Micro Era",
  description: "Stop brainstorming. Start evolving.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
