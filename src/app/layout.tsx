import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentRepurpose",
  description:
    "Upload your podcast or video. Get ready-to-publish posts for Twitter, LinkedIn, Instagram, and your newsletter — in your voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-primary text-text-primary">
        {children}
      </body>
    </html>
  );
}
