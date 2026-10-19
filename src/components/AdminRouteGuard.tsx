"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check session storage token and context claim
    const storedToken = sessionStorage.getItem('adminSessionToken');
    const hasAdminAccess = isAdmin || !!storedToken;

    if (!hasAdminAccess) {
      setIsAuthorized(false);
      // Immediately redirect standard users back to /team
      router.replace('/team');
    } else {
      setIsAuthorized(true);
    }
  }, [isAdmin, router]);

  if (isAuthorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-3">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">
          Redirecting to team workspace...
        </p>
      </div>
    );
  }

  if (isAuthorized === null || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
