import GoogleAnalytics from "@/components/google-analytics";
import Outbound from "@/components/outbound";
import AuthProvider from "@/components/providers/auth-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import { Noto_Serif } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Etymon.ai - Discover the Origin of Words",
  description:
    "Uncover the fascinating origins and meanings of words with Etymon.ai. Our interactive visual explorer breaks down word etymology, showing ancient roots and historical evolution. Perfect for language enthusiasts, students, and anyone curious about where words come from.",
  keywords:
    "etymology, word origins, language history, word meaning, linguistics, word roots, etymology tool, word etymology, word origin search, etymology dictionary, word history, language evolution",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Etymon.ai - Discover the Origin of Words",
    siteName: "Etymon.ai",
    description:
      "Uncover the fascinating origins and meanings of words with Etymon.ai. Our interactive visual explorer breaks down word etymology, showing ancient roots and historical evolution.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Etymon.ai - Interactive Word Etymology Explorer",
      },
    ],
    locale: "en_US",
    type: "website",
    url: "https://etymon.rumiallbert.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Etymon.ai - Discover the Origin of Words",
    description:
      "Uncover the fascinating origins and meanings of words with Etymon.ai. Our interactive visual explorer breaks down word etymology, showing ancient roots and historical evolution.",
    images: ["/og.png"],
    creator: "@rumiallbert",
    site: "@rumiallbert",
  },
  alternates: {
    canonical: "https://etymon.rumiallbert.com",
  },
  metadataBase: new URL("https://etymon.rumiallbert.com"),
  applicationName: "Etymon.ai",
  authors: [{ name: "Rumi Allbert", url: "https://rumiallbert.com" }],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Etymon.ai" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Etymon.ai" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <meta name="msapplication-config" content="none" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="address=no" />
      </head>
      <body className={notoSerif.className} suppressHydrationWarning>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <PlausibleProvider domain="etymon.rumiallbert.com">
                <div className="flex justify-between items-center absolute top-5 left-5 z-50 gap-4">
                  <Outbound />
                </div>
                <div className="absolute top-5 right-5 z-50">
                  <ThemeToggle />
                </div>
                {children}
                <Toaster />
              </PlausibleProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
