import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { ClearServiceWorker } from "@/components/ClearServiceWorker";

import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIOwSIS - Micro-Investment Optimizer",
  description: "Democratizing sustainable investing through automated micro-investments and ESG integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClearServiceWorker />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
