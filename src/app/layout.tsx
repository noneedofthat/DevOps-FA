import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import { EventProvider } from "@/context/EventContext";
import { Terminal } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hackathon & Tech Event Management Portal",
  description: "Manage and participate in technical competitions seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#f4f5f7] text-slate-900 flex flex-col min-h-screen`} suppressHydrationWarning>
        <AuthProvider>
          <EventProvider>
            <Navigation />
            
            <main className="flex-grow container mx-auto px-6 py-10 md:py-16">
              {children}
            </main>
            
            <footer className="bg-slate-950 text-slate-500 text-center py-8 text-sm mt-auto border-t border-slate-900">
              <div className="container mx-auto flex flex-col items-center gap-2">
                <Terminal size={20} className="text-slate-700" />
                <p>&copy; 2026 TenzorX Events. Cloud-native performance.</p>
              </div>
            </footer>
          </EventProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
