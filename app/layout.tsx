import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// TechnoAds Design System mandates Inter exclusively (see DESIGN.md). Two
// separate things have to line up for this to actually render as Inter:
// 1. Variable must NOT be named "--font-sans" — globals.css's `@theme inline`
//    block maps `--font-sans: var(--font-sans)`, and giving the next/font
//    variable that same name makes the declaration self-referential, which
//    CSS treats as invalid at compute time.
// 2. The class carrying "--font-inter" must be applied to <html>, not just
//    <body> — `@theme inline` registers `--font-sans: var(--font-inter)` at
//    `:root` (i.e. <html>). A CSS custom property var() reference resolves
//    using the declaring element's own scope, not a descendant's, so if
//    "--font-inter" were only defined on <body>, `:root`'s `--font-sans`
//    would still see it as unset, compute to invalid there, and that
//    (invalid) value is what inherits down — redefining --font-inter lower
//    on <body> doesn't retroactively fix an already-invalid ancestor value.
//    Confirmed by testing: with the variable only on <body>,
//    getComputedStyle(document.documentElement) showed --font-inter as
//    empty, and the page still rendered the browser's UA serif font.
const fontSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechnoAds — Sri Lanka Classifieds",
  description:
    "Free-to-post classifieds marketplace for Sri Lanka: Vehicles, Property, Techno/Gadgets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
