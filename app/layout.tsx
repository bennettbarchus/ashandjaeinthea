// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ashley & Jared | Save the Date | 11.14.26",
  description: "Save the date for the wedding of Ashley & Jared — November 14, 2026 in Atlanta, GA.",
  icons: {
    icon: "/images/aj-monogram-1.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}