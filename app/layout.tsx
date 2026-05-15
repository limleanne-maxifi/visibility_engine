import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: "AEO Visibility Check — Maxifi Digital",
  description: "Find out how visible your brand is in AI search — and get a free personalised action plan.",
  other: {
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
