import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
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
  openGraph: {
    title: "Simpod - Protect Your Flow",
    description:
      "AI-Powered Podcast Player for Language Learners. One-tap marking for the 20% you don't understand.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#00cffd",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
