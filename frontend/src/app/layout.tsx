import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeatPulse — Impact-Based Heat Early Warning | Chennai GCC",
  description:
    "Ward-level extreme heat early-warning intelligence platform for Greater Chennai Corporation. Integrating HTSI, UTCI, WBGT, population exposure, and healthcare adaptive capacity across 200 GCC wards.",
  keywords: [
    "HeatPulse",
    "Chennai",
    "heat wave",
    "UTCI",
    "WBGT",
    "HTSI",
    "early warning",
    "GCC",
    "public health",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
