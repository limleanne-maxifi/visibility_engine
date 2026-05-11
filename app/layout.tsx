import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEO Visibility Check — Maxifi Digital",
  description: "Find out how visible your brand is in AI search — and get a free personalised action plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
