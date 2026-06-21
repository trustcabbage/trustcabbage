import type { Metadata } from 'next'
import { Pontano_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const pontanoSans = Pontano_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Trust Cabbage — B2B Company Reviews for India',
    template: '%s | Trust Cabbage',
  },
  description: 'Read and write verified reviews for Indian B2B companies. Find trusted agencies, SaaS products, logistics providers, and more.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'),
  openGraph: {
    siteName: 'Trust Cabbage',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pontanoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-950">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
