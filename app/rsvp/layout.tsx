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

const RSVP_URL = "https://rsvp.ashandjaeinthea.com/rsvp";
const RSVP_TITLE = "Ashley & Jared · RSVP";
const RSVP_DESCRIPTION =
  "We're getting married in Atlanta on Saturday, November 14, 2026. Find your invitation, let us know you'll be joining us, and choose your menu for the reception.";

export const metadata: Metadata = {
  title: RSVP_TITLE,
  description: RSVP_DESCRIPTION,
  openGraph: {
    title: RSVP_TITLE,
    description: RSVP_DESCRIPTION,
    url: RSVP_URL,
    siteName: "Ashley & Jared",
    type: "website",
    locale: "en_US",
    // Resolved against metadataBase in app/layout.tsx.
    images: [
      {
        url: "/images/forth-skyline-sm.png",
        width: 768,
        height: 512,
        alt: "Watercolor of the Atlanta skyline at sunset",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: RSVP_TITLE,
    description: RSVP_DESCRIPTION,
    images: ["/images/forth-skyline-sm.png"],
  },
  alternates: { canonical: RSVP_URL },
};

export default function RsvpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${cinzel.variable} ${belleAurore.variable}`}>
      {children}
    </div>
  );
}
