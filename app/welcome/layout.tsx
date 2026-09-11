import type { Metadata } from "next";
import { Cinzel, La_Belle_Aurore, Playfair_Display } from "next/font/google";

// The same three fonts as the homepage and the RSVP portal, so the
// Welcome Celebration flow reads as the same site.
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
  title: "Welcome Celebration | Ashley & Jared",
  description:
    "Join Ashley & Jared for the Friday Welcome Celebration — November 13, 2026 in Atlanta, GA.",
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${cinzel.variable} ${belleAurore.variable}`}>
      {children}
    </div>
  );
}
