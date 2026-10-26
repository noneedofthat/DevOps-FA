// Location: src/app/login/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Users, Lightbulb, Trophy, ArrowRight, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle, loginAnonymously } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);
  const [fetchingDevLink, setFetchingDevLink] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ delivered: boolean; error?: string } | null>(null);

  // Check for NextAuth URL errors (e.g. ?error=Verification)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "Verification") {
      setMessage({
        text: "The magic link is invalid or has expired. Please enter your email to request a new link.",
        type: "error",
      });
    } else if (error === "AccessDenied") {
      setMessage({
        text: "Access denied. You do not have permission to access the requested resource.",
        type: "error",
      });
    } else if (error === "OAuthSignin" || error === "OAuthCallback") {
      setMessage({
        text: "Authentication provider handshake failed. Please try again.",
        type: "error",
      });
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await loginWithGoogle();
      router.push("/team");
    } catch (error: any) {
      console.error("Google sign in failed:", error);
      setMessage({
        text: "Google sign-in was cancelled or failed. Please check browser popups or try guest access.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await loginAnonymously();
      router.push("/team");
    } catch (error: any) {
      console.error("Demo participant sign-in failed:", error);
      setMessage({
        text: "Demo guest sign-in failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollLatestMagicLink = async (targetEmail: string) => {
    setFetchingDevLink(true);
    try {
      // Poll with exponential backoff for up to 3 seconds
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 600));
        const res = await fetch(`/api/auth/magic-link?email=${encodeURIComponent(targetEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            setDevMagicLink(data.url);
            setDeliveryInfo({ delivered: Boolean(data.delivered), error: data.error });
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Dev magic link lookup failed:", e);
    } finally {
      setFetchingDevLink(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();

    // RFC 5322 simplified email validation
    if (!sanitizedEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitizedEmail)) {
      setMessage({
        text: "Please enter a valid, standard email address (e.g. name@domain.com).",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setDevMagicLink(null);

    try {
      const res = await signIn("email", {
        email: sanitizedEmail,
        redirect: false,
        callbackUrl: "/team",
      });

      if (res?.error) {
        let errorDesc = "Failed to send magic link. Please try again.";
        if (res.error === "EmailSignin") {
          errorDesc = "SMTP delivery error. Verify mail credentials or inspect server logs.";
        } else if (res.error === "Configuration") {
          errorDesc = "Server authentication misconfiguration.";
        }
        setMessage({ text: errorDesc, type: "error" });
      } else {
        setSentEmail(sanitizedEmail);
        setMessage({
          text: `A secure authentication link has been dispatched to ${sanitizedEmail}. Please check your inbox.`,
          type: "success",
        });
        // Retrieve dev preview link for local testing and viva presentations
        pollLatestMagicLink(sanitizedEmail);
      }
    } catch (error) {
      console.error("Magic link dispatch error:", error);
      setMessage({
        text: "Network or server connection error. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Participant Portal</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Join HackGrid 2026 and build your team. Authenticate to manage submissions and team formation.
        </p>
      </div>

      {/* Primary OAuth Action Buttons */}
      <div className="space-y-2.5 mb-6">
        <button
          onClick={() => signIn("github", { callbackUrl: "/team" })}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer shadow-sm"
        >
          <GithubIcon size={18} />
          <span>Continue with GitHub</span>
        </button>
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer disabled:opacity-70"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>
        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer disabled:opacity-70"
        >
          <Users size={15} className="text-slate-500" />
          <span>Instant Guest Access (Viva & Testing Mode)</span>
        </button>
      </div>

      <div className="relative flex items-center py-2 mb-6">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-xs font-semibold tracking-widest text-slate-400 uppercase">Or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Magic Link Form */}
      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Sign in with email (Passwordless Magic Link)
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. participant@pccoe.edu"
              required
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
            <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-500/20 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Dispatching email...</span>
            </>
          ) : (
            <>
              <span>Send Magic Link</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Status Feedback Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : message.type === "error"
                ? "bg-rose-50 border border-rose-200 text-rose-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold leading-relaxed">{message.text}</p>
            </div>
          </div>
        )}

        {/* Senior Dev Feature: Viva Presentation & Development Shortcut */}
        {sentEmail && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Viva & Presentation Mode
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                deliveryInfo?.delivered
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {deliveryInfo?.delivered ? "Dispatched to Gmail" : "Campus Firewall Active"}
              </span>
            </div>

            {deliveryInfo && !deliveryInfo.delivered && (
              <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 leading-relaxed">
                <strong>Campus Network Notice:</strong> Outbound SMTP (ports 587/465) is blocked by the campus Wi-Fi firewall. Click the green button below to authenticate directly with your cryptographic single-use token!
              </div>
            )}

            <p className="text-xs text-slate-600 leading-normal">
              Single-use token generated for <strong>{sentEmail}</strong>:
            </p>

            {devMagicLink ? (
              <a
                href={devMagicLink}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-xs transition shadow-sm"
              >
                <span>Authenticate Instantly via Generated Link</span>
                <ExternalLink size={14} />
              </a>
            ) : fetchingDevLink ? (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1.5">
                <RefreshCw size={13} className="animate-spin text-blue-600" />
                <span>Synchronizing verification link...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => pollLatestMagicLink(sentEmail)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
              >
                Retrieve direct link preview
              </button>
            )}
          </div>
        )}
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Single sign-on protected by NextAuth &bull; 24-hour token validity &bull; Single-use token.
      </p>
    </div>
  );
}

export default function ParticipantLogin() {
  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Column: Branding (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 bg-slate-900 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
            Campus Innovation Sprint 2026
          </div>

          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            HackGrid Portal
          </h2>
          <p className="text-slate-400 text-base max-w-md leading-relaxed mb-12">
            The unified platform for team formation, real-time collaboration, and automated milestone evaluation.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700/50 flex-shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Dynamic Team Assembly</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Form squads of up to 4 members or join existing teams via unique invite tokens.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700/50 flex-shrink-0">
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Multi-Track Submissions</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Deploy projects across AI, Web3, FinTech, and Open Innovation tracks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700/50 flex-shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Live Rubric Scoring</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Transparent multi-criterion evaluations with real-time leaderboard aggregation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-16 text-slate-500 text-xs">
          PCCOE Department of Computer Engineering &bull; DevOps & SRE Lab
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading authentication portal...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
