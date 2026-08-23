import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RazorGrowth AI — Agentic Merchant Growth Copilot',
  description: 'Independent project built for the Razorpay AI Builder Internship 2026 challenge. Analyzes payment analytics and optimizes success rates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="h-full bg-zinc-950 text-zinc-100 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-zinc-900 border-r border-zinc-850 flex flex-col justify-between flex-shrink-0">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Header / Brand */}
            <div className="p-6 border-b border-zinc-850">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-b from-white via-zinc-200 to-amber-500/80 bg-clip-text text-transparent">
                  RazorGrowth AI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/5 text-amber-400 border border-amber-500/20 font-mono font-medium">
                  COPILOT
                </span>
              </Link>
              <p className="mt-2 text-[9px] leading-relaxed text-zinc-500">
                Independent project built for the Razorpay AI Builder Internship 2026. Uses synthetic data; not officially affiliated.
              </p>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 flex-1 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                Dashboard
              </Link>

              <Link
                href="/opportunities"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Opportunities
              </Link>

              <Link
                href="/agent"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                AI Growth Agent
              </Link>

              <Link
                href="/simulator"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 202 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                What-If Simulator
              </Link>

              <Link
                href="/activity"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white border-l-2 border-transparent hover:border-amber-500 hover:bg-zinc-900 pl-2.5 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity Log
              </Link>
            </nav>
          </div>

          {/* Footer details */}
          <div className="p-4 border-t border-zinc-850 text-[10px] text-zinc-600 text-center font-mono">
            RazorGrowth AI v1.0.0
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {children}
        </main>
      </body>
    </html>
  );
}
