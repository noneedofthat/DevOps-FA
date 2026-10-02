"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `pb-1 transition-all ${
      isActive
        ? "text-white border-b-2 border-blue-500 font-bold"
        : "text-slate-400 hover:text-white"
    }`;
  };

  return (
    <header className="bg-slate-900 text-slate-50 sticky top-0 z-50 border-b border-slate-800 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight hover:text-blue-400 transition">
          <Terminal size={24} className="text-blue-500" />
          <span>TenzorX<span className="text-blue-500">Portal</span></span>
        </Link>
        <nav>
          <ul className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
            <li><Link href="/" className={getLinkClass("/")}>Events</Link></li>
            <li><Link href="/team" className={getLinkClass("/team")}>Team</Link></li>
            <li><Link href="/submit" className={getLinkClass("/submit")}>Submit</Link></li>
            <li><Link href="/leaderboard" className={getLinkClass("/leaderboard")}>Leaderboard</Link></li>
            <li>
              <Link 
                href="/admin" 
                className={`pb-1 transition-all ${
                  pathname === "/admin" 
                    ? "text-amber-400 border-b-2 border-amber-500 font-bold" 
                    : "text-amber-500 hover:text-amber-400"
                }`}
              >
                Admin Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
