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

const WELCOME_URL = "https://rsvp.ashandjaeinthea.com/welcome";
const WELCOME_TITLE = "Ashley & Jared · Welcome Celebration";
const WELCOME_DESCRIPTION =
  "An evening of music, color and celebration as our families come together — Friday, November 13, 2026 in Atlanta. Find your invitation and let us know you'll be there.";

export const metadata: Metadata = {
  title: WELCOME_TITLE,
  description: WELCOME_DESCRIPTION,
  openGraph: {
    title: WELCOME_TITLE,
    description: WELCOME_DESCRIPTION,
    url: WELCOME_URL,
    siteName: "Ashley & Jared",
    type: "website",
    locale: "en_US",
    // Resolved against metadataBase in app/layout.tsx. 1143x601 is very
    // close to the 1.91:1 that Open Graph previews crop to, so it survives
    // the crop essentially intact.
    images: [
      {
        url: "/images/welcome_inspiration.png",
        width: 1143,
        height: 601,
        alt: "Guests in traditional Indian and African attire, celebrating together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: WELCOME_TITLE,
    description: WELCOME_DESCRIPTION,
    images: ["/images/welcome_inspiration.png"],
  },
  alternates: { canonical: WELCOME_URL },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${cinzel.variable} ${belleAurore.variable}`}>
      {children}
    </div>
  );
}
