"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  [key: string]: any;
}

type AuthContextType = {
  user: AppUser | User | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: 'admin' | 'participant';
  teamId: string | null;
  loginAnonymously: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setAdminSessionActive: (token: string, adminUser?: string) => void;
  clearAdminSession: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userRole: 'participant',
  teamId: null,
  loginAnonymously: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  setAdminSessionActive: () => {},
  clearAdminSession: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<AppUser | User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Strict verified admin session validation
  const checkAdminState = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Strict validation: An admin session MUST have an active admin_session=true cookie
    const hasAdminCookie = document.cookie
      .split(';')
      .some((item) => item.trim() === 'admin_session=true');

    if (!hasAdminCookie) {
      // If cookie was wiped or expired, purge any lingering storage tokens to prevent phantom hydration
      sessionStorage.removeItem('adminSessionToken');
      sessionStorage.removeItem('adminSessionUser');
      return false;
    }

    const token = sessionStorage.getItem('adminSessionToken');
    return Boolean(token || hasAdminCookie);
  };

  // Synchronize NextAuth session (GitHub OAuth and Magic Link)
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (session?.user) {
      const nextUser: AppUser = {
        uid: (session.user as any).id || (session.user as any).sub || session.user.email || 'participant_user',
        displayName: session.user.name || session.user.email?.split('@')[0] || 'Participant',
        email: session.user.email || '',
        photoURL: session.user.image || null,
      };
      setUser(nextUser);
      document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';

      if (db) {
        const qTeam = query(collection(db, "teams"), where("members", "array-contains", nextUser.uid));
        const unsubTeam = onSnapshot(qTeam, (snapshot) => {
          if (!snapshot.empty) {
            setTeamId(snapshot.docs[0].id);
          } else {
            setTeamId(null);
          }
        });
        return () => unsubTeam();
      }
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    // Initial validation
    setIsAdmin(checkAdminState());

    // Sync admin state on window focus or storage changes (e.g. cookie deletion in dev tools)
    const syncState = () => {
      setIsAdmin(checkAdminState());
    };

    window.addEventListener('storage', syncState);
    window.addEventListener('focus', syncState);

    if (!auth) {
      setLoading(false);
      return () => {
        window.removeEventListener('storage', syncState);
        window.removeEventListener('focus', syncState);
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';

        if (db) {
          const qTeam = query(collection(db, "teams"), where("members", "array-contains", currentUser.uid));
          const unsubTeam = onSnapshot(qTeam, (snapshot) => {
            if (!snapshot.empty) {
              setTeamId(snapshot.docs[0].id);
            } else {
              setTeamId(null);
            }
          });
          return () => unsubTeam();
        }
      } else if (!session?.user) {
        // Only reset to null if NextAuth session is also not active
        setUser(null);
        setTeamId(null);
      }

      setIsAdmin(checkAdminState());
      setLoading(false);
    });

    return () => {
      window.removeEventListener('storage', syncState);
      window.removeEventListener('focus', syncState);
      unsubscribe();
    };
  }, [session]);

  // Synchronize admin session when updated
  const setAdminSessionActive = (token: string, adminUser: string = 'admin') => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminSessionToken', token);
      sessionStorage.setItem('adminSessionUser', adminUser);
      document.cookie = `admin_session=true; path=/; max-age=28800; SameSite=Lax`;
      setIsAdmin(true);
    }
  };

  const clearAdminSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminSessionToken');
      sessionStorage.removeItem('adminSessionUser');
      document.cookie = `admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      setIsAdmin(false);
    }
  };

  const loginAnonymously = async () => {
    if (!auth) return;
    try {
      await signInAnonymously(auth);
      if (typeof window !== 'undefined') {
        document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';
      }
    } catch (error) {
      console.error("Anonymous auth error:", error);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      alert("Firebase is not configured! Please provide your Firebase credentials.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      if (typeof window !== 'undefined') {
        document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';
      }
    } catch (error) {
      console.error("Google Participant Auth error:", error);
      alert("Participant authentication failed or was cancelled.");
    }
  };

  // Forceful session teardown: clears sessionStorage, localStorage, cookies, and redirects
  const logout = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (e) {
      console.error("NextAuth signOut error:", e);
    }

    if (typeof window !== 'undefined') {
      // 1. Forcefully clear sessionStorage
      sessionStorage.clear();

      // 2. Forcefully clear localStorage
      localStorage.clear();

      // 3. Forcefully purge known authentication cookies
      const cookiesToPurge = [
        'admin_session',
        'participant_session',
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
      ];

      cookiesToPurge.forEach((name) => {
        document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      // Clear any remaining cookies in document.cookie
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
    }

    setUser(null);
    setIsAdmin(false);
    setTeamId(null);

    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Sign out error:", e);
      }
    }

    // Hard redirect to /login to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: loading && sessionStatus === "loading", 
      isAdmin, 
      userRole: isAdmin ? 'admin' : 'participant',
      teamId,
      loginAnonymously, 
      loginWithGoogle, 
      logout,
      setAdminSessionActive,
      clearAdminSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);