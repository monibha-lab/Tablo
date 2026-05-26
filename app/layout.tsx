import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'
import { PushRegistration } from '@/components/PushRegistration'

export const metadata: Metadata = {
  title: 'Tablo — School Timetable Management',
  description: 'Generate, manage, and publish school timetables with real-time conflict detection.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-ivory text-espresso antialiased">
        {children}
        <ToastContainer />
        <PushRegistration />
      </body>
    </html>
  )
}
