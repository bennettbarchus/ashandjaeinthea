import type { Metadata } from "next";
import { Cinzel, La_Belle_Aurore, Playfair_Display } from "next/font/google";

// The same three fonts loaded by the homepage (app/page.tsx), so the RSVP
// portal reads as the same site rather than a bolted-on tool.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

const belleAurore = La_Belle_Aurore({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-belleaurore",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSVP | Ashley & Jared",
  description: "RSVP for the wedding of Ashley & Jared — November 14, 2026 in Atlanta, GA.",
};

export default function RsvpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${cinzel.variable} ${belleAurore.variable}`}>
      {children}
    </div>
  );
}
