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
  openGraph: {
    title: "Etymon.ai",
    siteName: "Etymon.ai",
    description: "Understand the origins of words",
    images: "/og.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={notoSerif.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark">
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
