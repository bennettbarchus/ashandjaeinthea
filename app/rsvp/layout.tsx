import type { Metadata } from "next";
import { Lora, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSVP | Ashley & Jared",
  description: "RSVP for the wedding of Ashley & Jared — November 14, 2026 in Atlanta, GA.",
};

export default function RsvpLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${playfair.variable} ${lora.variable}`}>{children}</div>;
}
