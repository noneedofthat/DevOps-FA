"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, KeyRound, 
  ArrowRight, AlertCircle, RefreshCw, Trophy, ArrowLeft
} from 'lucide-react';
import { verifyAdminTOTP, fetchAdminTotpInfo } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminTotpLoginPage() {
  const router = useRouter();
  const { setAdminSessionActive } = useAuth();

  const [email, setEmail] = useState('admin@hackgrid.internal');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [totpInfo, setTotpInfo] = useState<{ secretBase32: string; currentLiveCode: string } | null>(null);
  const [showSecretGuide, setShowSecretGuide] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchAdminTotpInfo().then((data) => {
      if (data) setTotpInfo(data);
    });
  }, []);

  // Handle individual 6-digit TOTP input & auto-advance
  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...totpDigits];
    
    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1];
      setTotpDigits(newDigits);
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = '';
      setTotpDigits(newDigits);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setTotpDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleQuickFillCode = () => {
    if (totpInfo?.currentLiveCode) {
      const digits = totpInfo.currentLiveCode.split('');
      setTotpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsRateLimited(false);

    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();
    const fullTotp = totpDigits.join('').trim();

    if (!trimmedEmail) {
      setErrorMessage('Administrator email address is required.');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Security Key / Password is required.');
      return;
    }

    if (fullTotp.length !== 6 || totpDigits.some((d) => !d.trim())) {
      setErrorMessage('Please enter the complete 6-digit authenticator code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyAdminTOTP(trimmedEmail, trimmedPassword, fullTotp);

      if (result.isRateLimited) {
        setIsRateLimited(true);
        setRetryAfterSeconds(result.retryAfter || 60);
        setErrorMessage(result.error || 'Rate limit exceeded.');
        setIsLoading(false);
        return;
      }

      if (result.success === true && typeof result.token === 'string') {
        const token: string = result.token;

        // Strict session isolation: Purge all participant tokens to prevent identity bleed
        document.cookie = 'next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = '__Secure-next-auth.session-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'participant_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        sessionStorage.removeItem('demo_participant_user');

        sessionStorage.setItem('adminSessionToken', token);
        sessionStorage.setItem('adminSessionUser', trimmedEmail);
        if (setAdminSessionActive) {
          setAdminSessionActive(token, trimmedEmail);
        }

        router.push('/admin/submissions');
        return;
      }

      setErrorMessage(result.error || 'Access denied: Invalid credentials or TOTP code.');
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication service unreachable.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-900 md:h-screen md:overflow-hidden">
      
      {/* Left Column: Dark Branding & Security Context (Matches Participant Login) */}
      <div className="hidden md:flex w-1/2 bg-slate-900 flex-col justify-between p-12 lg:p-16 relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35"></div>

        {/* Top Tag */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck size={14} />
            <span>Faculty Evaluation Council</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
            HackGrid Admin Console
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Dedicated administrative workspace for milestone scoring, real-time rubric evaluation, and event telemetry.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="relative z-10 space-y-5 my-auto py-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700/60 flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Cryptographic RBAC</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Edge-verified JWT session guards with strict role-based separation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700/60 flex-shrink-0">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Rubric Scoring Engine</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Multi-parameter evaluation across Innovation, Architecture, and Delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700/60 flex-shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">RFC 6238 Multi-Factor Auth</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Time-based one-time passcodes with replay attack mitigation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-slate-500 text-xs">
          PCCOE Department of Computer Engineering &bull; DevOps & SRE Lab
        </div>
      </div>

      {/* Right Column: Clean White Authentication Card (Matching Participant Login) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="max-w-md w-full">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-xl font-black tracking-tight text-slate-900">HACK</span>
              <span className="text-xl font-black tracking-tight text-blue-600">GRID</span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 ml-2">
                Faculty Admin
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your administrative credentials and authenticator code.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2.5 ${
              isRateLimited 
                ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hackgrid.internal"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Security Key
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Bcrypt Protected
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* 6-Digit TOTP Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Authenticator Code (6-digit TOTP)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSecretGuide(!showSecretGuide)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <KeyRound size={12} />
                  <span>{showSecretGuide ? 'Hide Secret' : 'Show Authenticator Key'}</span>
                </button>
              </div>

              {/* Secret helper card */}
              {showSecretGuide && (
                <div className="p-3 mb-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Base32 Secret:</span>
                    <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {totpInfo?.secretBase32 || 'JBSWY3DPEHPK3PXP'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                    <span className="text-slate-500">Google Authenticator compatible</span>
                    {totpInfo?.currentLiveCode && (
                      <button
                        type="button"
                        onClick={handleQuickFillCode}
                        className="font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Autofill {totpInfo.currentLiveCode}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 6 Digit Grid */}
              <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {totpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-full h-11 text-center font-mono font-bold text-base bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isRateLimited}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Console</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium transition"
            >
              <ArrowLeft size={13} />
              <span>Participant Login</span>
            </Link>
            <span className="text-[11px] text-slate-400">
              Edge RBAC &bull; RFC 6238
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
