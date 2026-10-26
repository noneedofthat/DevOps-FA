"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, Users, FileText, Trophy, Settings, 
  Search, Bell, ChevronDown, Shield, LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAdmin, logout, clearAdminSession } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // If on full-page auth screens, hide standard sidebar
  if (pathname === "/admin/login" || pathname === "/login") {
    return null;
  }

  // Base navigation rail for all participants
  const baseNavItems = [
    { label: "Events", href: "/", icon: Calendar },
    { label: "Team", href: "/team", icon: Users },
    { label: "Submit", href: "/submit", icon: FileText },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  // RBAC: Conditionally append Admin navigation link ONLY if user session has admin role claim
  const navItems = isAdmin 
    ? [...baseNavItems, { label: "Admin", href: "/admin/submissions", icon: Settings }]
    : baseNavItems;

  // Helper for active route check
  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href) || (href === "/admin/submissions" && pathname.startsWith("/admin"));
  };

  // Determine current breadcrumb section
  const getBreadcrumbName = () => {
    if (pathname === "/") return "Events";
    if (pathname.startsWith("/team")) return "Team";
    if (pathname.startsWith("/submit")) return "Submit";
    if (pathname.startsWith("/leaderboard")) return "Leaderboard";
    if (pathname.startsWith("/admin/submissions")) return "Admin / Submissions";
    if (pathname.startsWith("/admin")) return "Admin";
    if (pathname.startsWith("/judge")) return "Judging / Evaluate Submission";
    return "Workspace";
  };

  // Derive active user identity with strict Admin role isolation
  const storedAdminEmail = typeof window !== 'undefined' ? sessionStorage.getItem('adminSessionUser') : null;
  const isViewingAdmin = pathname.startsWith('/admin') || (isAdmin && Boolean(storedAdminEmail));

  const displayUser = isViewingAdmin
    ? {
        displayName: 'Faculty Administrator',
        email: storedAdminEmail || 'admin@hackgrid.internal',
        initials: 'FA',
        roleBadge: 'Council Admin',
      }
    : {
        displayName: user?.displayName || (user ? 'Participant' : 'Guest User'),
        email: user?.email || 'Not signed in',
        initials: user?.displayName
          ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : user?.email
          ? user.email.slice(0, 2).toUpperCase()
          : 'GU',
        roleBadge: null,
      };

  const userInitials = displayUser.initials;


  return (
    <>
      {/* 1. LEFT SIDEBAR (HACKGRID) */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 z-40 hidden md:flex flex-col justify-between select-none">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 px-6 flex items-center border-b border-slate-100">
            <Link href="/" className="flex items-center gap-1.5 text-xl font-black tracking-tight">
              <span className="text-slate-900">HACK</span>
              <span className="text-blue-600">GRID</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Platform Status & Discreet Faculty/Admin Access */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">Sprint 2026 Live</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span>Department of Computer Eng.</span>
            {!isAdmin && (
              <Link 
                href="/admin/login" 
                className="text-slate-400 hover:text-blue-600 transition flex items-center gap-1 font-semibold hover:underline"
                title="Admin & Faculty MFA Portal"
              >
                <Shield size={12} />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* 2. TOP HEADER BAR */}
      <header className="fixed top-0 right-0 left-0 md:left-60 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 flex items-center justify-between px-4 sm:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="text-slate-400 hover:text-slate-600">Workspace</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">{getBreadcrumbName()}</span>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-4">
          
          {/* Search Box */}
          <div className="relative hidden sm:block w-72">
            <input
              type="text"
              placeholder="Search events, teams, submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (isProfileOpen) setIsProfileOpen(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      3 New
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-900">Sprint 2026 Live</span>
                      <span className="text-[10px] text-blue-500">Just now</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Campus Innovation Sprint 2026 is officially active. Form your team and prepare submissions.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">Submission Deadline</span>
                      <span className="text-[10px] text-slate-400">18 Oct, 11:59 PM</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Final project submission with repository URL and presentation PDF closes on 18 Oct 2026.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">Team Workspace Ready</span>
                      <span className="text-[10px] text-slate-400">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Invite teammates using your unique 6-character team invite code in the Team workspace.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                if (isNotificationsOpen) setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full ${isViewingAdmin ? 'bg-blue-600' : 'bg-slate-900'} text-white font-black text-xs flex items-center justify-center shadow-sm`}>
                {userInitials}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-slate-900 truncate">
                      {displayUser.displayName}
                    </p>
                    {displayUser.roleBadge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        {displayUser.roleBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-mono">
                    {displayUser.email}
                  </p>
                </div>

                {isViewingAdmin ? (
                  <>
                    <Link
                      href="/admin/submissions"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-blue-700 bg-blue-50/60 font-semibold"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/leaderboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Live Leaderboard
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Events Console
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/team"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      My Team Workspace
                    </Link>
                    <Link
                      href="/submit"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Submit Project
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/submissions"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-3 py-2 rounded-xl text-blue-700 hover:bg-blue-50 font-semibold"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                )}

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (isViewingAdmin) {
                      clearAdminSession();
                      window.location.href = '/admin/login';
                    } else {
                      logout();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-3 rounded-lg transition ${
                active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
