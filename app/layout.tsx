import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['100', '300'],
  variable: '--font-exo2',
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
    <html lang="en" className={exo2.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
