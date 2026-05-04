import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
variable: "--font-serif",
subsets: ["latin"],
weight: ["400", "500", "600", "700"],
});

const sans = Inter({
variable: "--font-sans",
subsets: ["latin"],
});

export const metadata: Metadata = {
title: "Ashley + Jared",
description: "Wedding weekend details for Ashley and Jared in Atlanta, Georgia.",
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="en" className={`${serif.variable} ${sans.variable}`}>
<body>{children}</body>
</html>
);
} 
