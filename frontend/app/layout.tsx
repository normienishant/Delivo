import React from "react";
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

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
        {/* 🔥 FINAL NUKE – executes before any other script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Unregister all service workers immediately
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(reg) { reg.unregister(); });
                  });
                }

                // 2. Remove any <link rel="manifest"> that could trigger the prompt
                var link = document.querySelector('link[rel="manifest"]');
                if (link) link.remove();

                // 3. Permanently delete the native API
                Object.defineProperty(navigator, 'getInstalledRelatedApps', {
                  get: function() { return undefined; },
                  set: function() {},
                  configurable: false
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}