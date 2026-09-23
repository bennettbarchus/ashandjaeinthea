import type { Metadata } from "next";
import { Cinzel, Playfair_Display } from "next/font/google";

// Same two workhorse fonts as the RSVP portal (the La Belle Aurore script
// is decorative and has no place in a working tool), bound to the CSS
// variables globals.css maps font-playfair / font-cinzel onto.
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

// Internal tool: keep it out of search results and link previews. It is
// also deliberately absent from every navigation on the public site.
export const metadata: Metadata = {
  title: "Seating Chart",
  robots: { index: false, follow: false },
};

export default function SeatingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${playfair.variable} ${cinzel.variable}`}>{children}</div>
  );
}
