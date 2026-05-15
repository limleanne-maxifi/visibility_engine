import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: "AEO Visibility Snapshot — Maxifi Digital",
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
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
