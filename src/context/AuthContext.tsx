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
    const hasAdminCookie = /(?:^|;\s*)admin_session=true(?=;|$)/.test(document.cookie);

    if (!hasAdminCookie) {
      // If cookie was wiped or expired and not on an admin route, purge storage tokens
      const onAdminRoute = window.location.pathname.startsWith('/admin');
      if (!onAdminRoute) {
        sessionStorage.removeItem('adminSessionToken');
        sessionStorage.removeItem('adminSessionUser');
        return false;
      }
    }

    const token = sessionStorage.getItem('adminSessionToken');
    return Boolean(token || hasAdminCookie);
  };

  // Synchronize NextAuth session (GitHub OAuth and Magic Link)
  useEffect(() => {
    if (sessionStatus === "loading") return;

    // Isolate Admin Session: Do not overwrite Faculty Administrator identity with participant tokens
    if (checkAdminState()) {
      const activeAdminEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('adminSessionUser') || 'admin@hackgrid.internal') : 'admin@hackgrid.internal';
      setUser({
        uid: 'admin_faculty_council',
        displayName: 'Faculty Administrator',
        email: activeAdminEmail,
        photoURL: null,
      });
      setIsAdmin(true);
      return;
    }

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
    const hasAdminSession = checkAdminState();
    setIsAdmin(hasAdminSession);
    if (hasAdminSession) {
      const activeAdminEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('adminSessionUser') || 'admin@hackgrid.internal') : 'admin@hackgrid.internal';
      setUser({
        uid: 'admin_faculty_council',
        displayName: 'Faculty Administrator',
        email: activeAdminEmail,
        photoURL: null,
      });
    }

    // Sync admin state on window focus or storage changes (e.g. cookie deletion in dev tools)
    const syncState = () => {
      const adminActive = checkAdminState();
      setIsAdmin(adminActive);
      if (adminActive) {
        const activeAdminEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('adminSessionUser') || 'admin@hackgrid.internal') : 'admin@hackgrid.internal';
        setUser({
          uid: 'admin_faculty_council',
          displayName: 'Faculty Administrator',
          email: activeAdminEmail,
          photoURL: null,
        });
      }
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
      if (checkAdminState()) {
        const activeAdminEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('adminSessionUser') || 'admin@hackgrid.internal') : 'admin@hackgrid.internal';
        setUser({
          uid: 'admin_faculty_council',
          displayName: 'Faculty Administrator',
          email: activeAdminEmail,
          photoURL: null,
        });
        setIsAdmin(true);
        setLoading(false);
        return;
      }

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
        // Only reset to null if NextAuth session and demo session are also not active
        const storedDemo = typeof window !== 'undefined' ? sessionStorage.getItem('demo_participant_user') : null;
        if (storedDemo) {
          try {
            setUser(JSON.parse(storedDemo));
          } catch (e) {
            setUser(null);
            setTeamId(null);
          }
        } else {
          setUser(null);
          setTeamId(null);
        }
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
      sessionStorage.removeItem('demo_participant_user');
      document.cookie = `admin_session=true; path=/; max-age=28800; SameSite=Lax`;
      document.cookie = `participant_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `__Secure-next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      setIsAdmin(true);
      setUser({
        uid: 'admin_faculty_council',
        displayName: 'Faculty Administrator',
        email: adminUser,
        photoURL: null,
      });
      try {
        nextAuthSignOut({ redirect: false });
      } catch {}
      try {
        if (auth) signOut(auth);
      } catch {}
    }
  };

  const clearAdminSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminSessionToken');
      sessionStorage.removeItem('adminSessionUser');
      sessionStorage.removeItem('demo_participant_user');
      // Instruct Next.js server route to clear the HttpOnly admin_jwt cookie
      fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
      document.cookie = `admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `participant_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `__Secure-next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      setIsAdmin(false);
      setUser(null);
      try {
        nextAuthSignOut({ redirect: false });
      } catch {}
      try {
        if (auth) signOut(auth);
      } catch {}
    }
  };

  const loginAnonymously = async () => {
    const demoUser: AppUser = {
      uid: 'demo_participant_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Demo Participant',
      email: 'student.demo@pccoe.edu',
    };
    try {
      if (auth) {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.warn("Firebase anonymous auth fallback:", error);
    } finally {
      if (typeof window !== 'undefined') {
        document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';
        sessionStorage.setItem('demo_participant_user', JSON.stringify(demoUser));
        setUser(demoUser);
      }
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase authentication service is not initialized.");
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    if (typeof window !== 'undefined') {
      document.cookie = 'participant_session=true; path=/; max-age=28800; SameSite=Lax';
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
      sessionStorage.removeItem('demo_participant_user');
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