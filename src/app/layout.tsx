import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "klodchain - autonomous Blockchain designed by claude",
    template: "%s | klodchain",
  },
  description:
    "Educational blockchain powered by 6 autonomous KLOD agents. Real-time block production, transaction processing, and consensus visualization.",
  keywords: [
    "blockchain",
    "KLOD",
    "klodchain",
    "autonomous agents",
    "educational",
    "crypto",
    "web3",
    "proof of history",
    "validators",
  ],
  authors: [{ name: "buildwithrekt", url: "https://github.com/buildwithrekt" }],
  creator: "buildwithrekt",
  publisher: "klodchain",
  metadataBase: new URL("https://klodchain.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://klodchain.vercel.app",
    siteName: "klodchain",
    title: "klodchain - autonomous blockchain designed by claude",
    description:
      "Blockchain powered by 6 autonomous KLOD agents. Real-time block production and consensus visualization.",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "klodchain - autonomous blockchain designed by claude",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "klodchain - autonomous blockchain designed by claude",
    description:
    "Blockchain powered by 6 autonomous KLOD agents. Real-time block production and consensus visualization.",
    images: ["/assets/og-image.png"],
    creator: "@buildwithrekt",
  },
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
  icons: {
    icon: "/favicons/favicon.ico",
    shortcut: "/favicons/favicon-96x96.png",
    apple: "/favicons/apple-touch-icon.png",
  },
  manifest: "/favicons/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
