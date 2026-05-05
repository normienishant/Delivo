import React from "react";
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Script from 'next/script';   // we'll keep the beforeInteractive as backup

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Delivo — Your AI Delivery Twin",
  description:
    "Predict delivery times, forecast demand, and optimize your fleet with real-time machine learning — trained on 45,000+ Indian city delivery records.",
  generator: "v0.app",
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        {/* 1. Permission policy still useful as safety net */}
        <meta httpEquiv="Permissions-Policy" content="get-installed-related-apps=()" />

        {/* 2. 🔒 IMMEDIATE INLINE SYNC SCRIPT – runs before any other JS is parsed */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Erase the API before anything can call it
              Object.defineProperty(navigator, 'getInstalledRelatedApps', {
                value: () => Promise.resolve([]),
                writable: false,
                configurable: false,
              });
            `,
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {/* 3. Backup – runs again just in case (double lock) */}
        <Script id="kill-related-apps-backup" strategy="beforeInteractive">
          {`
            Object.defineProperty(navigator, 'getInstalledRelatedApps', {
              value: () => Promise.resolve([]),
              writable: false,
              configurable: false,
            });
          `}
        </Script>

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}