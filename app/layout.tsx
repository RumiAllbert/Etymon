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
  title: "Etymon.ai",
  description: "Understand the origins of words",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Etymon.ai",
    siteName: "Etymon.ai",
    description: "Understand the origins of words",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Etymon.ai",
    description: "Understand the origins of words",
    images: ["/og.png"],
    creator: "@rumiallbert",
  },
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
