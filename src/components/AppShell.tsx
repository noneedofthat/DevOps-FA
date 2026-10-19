"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin/login" || pathname === "/login";

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navigation />
      <main className="flex-grow w-full md:pl-60 pt-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-12">
          {children}
        </div>
      </main>
    </>
  );
}
