import GoogleAnalytics from "@/components/google-analytics";
import Outbound from "@/components/outbound";
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
  title: "Etymon.ai - Understand the Origins of Words",
  description:
    "Explore the etymology and origins of words with Etymon.ai. Discover the historical roots, meanings, and evolution of any word in an interactive visual format.",
  keywords:
    "etymology, word origins, language history, word meaning, linguistics, word roots, etymology tool, word etymology",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Etymon.ai - Understand the Origins of Words",
    siteName: "Etymon.ai",
    description:
      "Explore the etymology and origins of words with Etymon.ai. Discover the historical roots, meanings, and evolution of any word in an interactive visual format.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Etymon.ai - Understand the origins of words",
      },
    ],
    locale: "en_US",
    type: "website",
    url: "https://etymon.rumiallbert.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Etymon.ai - Understand the Origins of Words",
    description:
      "Explore the etymology and origins of words with Etymon.ai. Discover the historical roots, meanings, and evolution of any word in an interactive visual format.",
    images: ["/og.png"],
    creator: "@rumiallbert",
    site: "@rumiallbert",
  },
  alternates: {
    canonical: "https://etymon.rumiallbert.com",
  },
  metadataBase: new URL("https://etymon.rumiallbert.com"),
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
      </head>
      <body className={notoSerif.className} suppressHydrationWarning>
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
      </body>
    </html>
  );
}
