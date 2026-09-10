import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HeatPulse — Chennai Extreme Heat Early Warning System",
  description:
    "Impact-based thermal early warning dashboard for Greater Chennai Corporation. Real-time UTCI, WBGT, and HTSI monitoring across 200 GCC wards with 5-day calibrated forecasts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100">
        {children}
      </body>
    </html>
  );
}
