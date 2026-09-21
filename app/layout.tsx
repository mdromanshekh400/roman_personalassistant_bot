import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roman Personal Assistant",
  description: "Personal AI assistant powered by Telegram, Neon and OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
