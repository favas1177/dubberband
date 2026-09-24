import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dubberband – AI Video Translation",
    template: "%s | Dubberband",
  },
  description:
    "Dubberband is a white-labeled AI video translation SaaS. Translate your videos into any language with Indigo-powered lip-sync technology.",
  keywords: ["AI video translation", "lip sync", "dubbing", "Dubberband"],
  openGraph: {
    title: "Dubberband – AI Video Translation",
    description: "Translate your videos into any language with AI-powered lip-sync.",
    type: "website",
  },
};

/**
 * Root layout — only contains html/body shell.
 * Sidebar is rendered by the (dashboard) route group layout so the
 * proofread editor can opt out of it cleanly.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
