import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zenta — AI Business Agent',
  description: 'Automate your freelance business with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <NextTopLoader color="#6c47e8" height={3} showSpinner={false} />
        {children}
      </body>
    </html>
  )
}