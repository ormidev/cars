import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Accounts — RFID Wallet",
  description: "Track your RFID and transit card accounts in one place.",
  applicationName: "Car Accounts",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Car Accounts",
  },
  icons: {
    icon: [
      { url: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#265cf5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var saved=localStorage.getItem('car-accounts-theme');var dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light'}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
