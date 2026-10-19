import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/TelegramProvider";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "CCCGuru — Telegram Mini App",
  description:
    "Official NIELIT CCC Exam Preparation & Mock Test Series on Telegram.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6610f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col justify-between overflow-x-hidden"
      >
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        <TelegramProvider>
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
