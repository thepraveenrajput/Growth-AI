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
  title: 'RazorGrowth AI — Merchant Growth Copilot',
  description: 'Independent project built for the Razorpay AI Builder Internship 2026 challenge. Analyzes payment analytics and optimizes success rates.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="h-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none">
        
        {/* Top Navigation Header (Fintech Style) */}
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-20 flex-shrink-0">
          {/* Logo & Selector */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                RAZORGROWTH AI
              </span>
              <span className="text-[8px] px-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono font-bold tracking-wider">
                COPILOT
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-5">
              <span className="text-[9px] text-zinc-550 font-mono uppercase tracking-wider">Merchant</span>
              <select className="bg-transparent border-0 text-[11px] font-bold text-zinc-300 focus:ring-0 focus:outline-none cursor-pointer">
                <option value="acme">Acme Marketplace Inc.</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <svg className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search transactions, customers, or opportunities" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-zinc-750 font-mono"
                readOnly
              />
            </div>
          </div>

          {/* Right Header Menu */}
          <div className="flex items-center gap-4">
            <div className="bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5">
              <span className="w-1 h-1 bg-emerald-500 rounded-full" />
              <span>Data updated 2 min ago</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-1.5 text-zinc-400 hover:text-white transition-colors" title="No unread notifications">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile Avatar */}
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold font-mono text-zinc-350" title="Acme Admin">
              AM
            </div>
          </div>
        </header>

        {/* Sidebar + Main Workspace split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between flex-shrink-0 z-10">
            <div className="flex flex-col flex-1 py-4 overflow-y-auto">
              <nav className="px-3 space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                  </svg>
                  Overview
                </Link>

                <Link
                  href="/opportunities"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Opportunities
                </Link>

                <Link
                  href="/agent"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  AI Agent Workbench
                </Link>

                <Link
                  href="/simulator"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 202 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                  What-If Simulator
                </Link>

                <Link
                  href="/activity"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40 transition-all duration-150"
                >
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activity Log
                </Link>
              </nav>
            </div>

            {/* Sticky disclaimer Footer */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50">
              <p className="text-[8px] leading-relaxed text-zinc-500 font-mono">
                Independent project built for the Razorpay AI Builder Internship 2026 challenge. Uses synthetic payment data.
              </p>
            </div>
          </aside>

          {/* Main workspace frame */}
          <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
