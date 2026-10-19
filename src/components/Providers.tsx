// Location: src/components/Providers.tsx
"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/AuthContext";
import { EventProvider } from "@/context/EventContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <EventProvider>
          {children}
        </EventProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
