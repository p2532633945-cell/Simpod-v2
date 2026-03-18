import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MiniPlayer } from "@/components/player/MiniPlayer"
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Simpod - Protect Your Flow",
  description:
    "AI-Powered Podcast Player for Language Learners. One-tap marking for the 20% you don't understand. Keep listening, keep flowing.",
  keywords: [
    "podcast",
    "language learning",
    "transcription",
    "hotzones",
    "AI",
    "listening",
  ],
  authors: [{ name: "Simpod" }],
  manifest: "/manifest.json?v=4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Simpod",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Simpod - Protect Your Flow",
    description:
      "AI-Powered Podcast Player for Language Learners. One-tap marking for the 20% you don't understand.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA iOS Safari */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Simpod" />
        {/* PWA splash screen color for older iOS */}
        <meta name="msapplication-TileColor" content="#0a0a0f" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <MiniPlayer />
          <PWAInstallPrompt />
        </ThemeProvider>
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('[PWA] Service Worker registered:', reg.scope);
                  }).catch(function(err) {
                    console.warn('[PWA] Service Worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
