import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Analyze your trading performance with interactive charts and statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--bg)]">
        {children}
      </body>
    </html>
  );
}
