"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, KeyRound, 
  ArrowRight, AlertCircle, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { verifyAdminTOTP } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminTotpLoginPage() {
  const router = useRouter();
  const { setAdminSessionActive } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle individual 6-digit TOTP input & auto-tab
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...totpDigits];
    
    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1];
      setTotpDigits(newDigits);
      // Auto-advance to next input
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsRateLimited(false);

    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();
    const fullTotp = totpDigits.join('').trim();

    // Strict client-side validation: reject empty fields before making network calls
    if (!trimmedEmail) {
      setErrorMessage('Administrator email address is required.');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Security Key / Password is required.');
      return;
    }

    if (fullTotp.length !== 6 || totpDigits.some((d) => !d.trim())) {
      setErrorMessage('Please enter the full 6-digit authenticator code.');
      return;
    }

    setIsLoading(true);

    try {
      // Execute backend TOTP verification utility (POST to /api/admin/verify)
      const result = await verifyAdminTOTP(trimmedEmail, trimmedPassword, fullTotp);

      if (result.isRateLimited) {
        setIsRateLimited(true);
        setRetryAfterSeconds(result.retryAfter || 60);
        setErrorMessage(result.error || 'Rate limit exceeded.');
        setIsLoading(false);
        return;
      }

      // STRICT VALIDATION: Only issue cookie and redirect if backend explicitly returns success === true
      if (result.success === true && typeof result.token === 'string') {
        const token: string = result.token;
        
        // Issue admin_session cookie for Edge middleware clearance
        document.cookie = 'admin_session=true; path=/; max-age=28800; SameSite=Lax';
        
        // Sync session storage and AuthContext state
        sessionStorage.setItem('adminSessionToken', token);
        sessionStorage.setItem('adminSessionUser', trimmedEmail);
        if (setAdminSessionActive) {
          setAdminSessionActive(token, trimmedEmail);
        }

        router.push('/admin/submissions');
        return;
      }

      // In any other case: fail closed, do not issue cookie, do not redirect
      setErrorMessage(result.error || 'Access denied: Invalid credentials or TOTP code.');
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication service unreachable.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden font-sans">
      {/* 3D Cyber Cube Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
      
      {/* Left decorative card */}
      <div className="hidden lg:block absolute left-12 top-1/3 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md text-xs font-mono text-slate-400 max-w-xs shadow-2xl">
        <div className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-1">
          ADMIN JUDGE PORTAL
        </div>
        <div className="w-8 h-1 bg-blue-600 rounded-full mb-3"></div>
        <div className="space-y-1 text-slate-500 text-[11px]">
          <div>• Multi-Factor Authentication</div>
          <div>• Role-Based Access Control</div>
          <div>• Elasticsearch Audit Stream</div>
        </div>
      </div>

      {/* Right decorative card */}
      <div className="hidden lg:block absolute right-12 top-1/3 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md text-xs font-mono text-slate-400 max-w-xs shadow-2xl text-right">
        <div className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mb-1">
          SECURE AUDITED MONITORED
        </div>
        <div className="w-8 h-1 bg-blue-600 rounded-full mb-3 ml-auto"></div>
        <div className="space-y-1 text-slate-500 text-[11px]">
          <div>Rate Limiting: 5 req/min</div>
          <div>Cipher: TLS 1.3 / AES-256-GCM</div>
          <div>Session TTL: 3600 seconds</div>
        </div>
      </div>

      {/* Main Admin Dark Card (Matches media_1791829379066_5235b7ac.png) */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 p-8 sm:p-10 backdrop-blur-xl">
        
        {/* Top Logo & Shield Badge */}
        <div className="text-center space-y-3 mb-6">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white">HACK</span>
            <span className="text-lg font-black tracking-tight text-blue-500">GRID</span>
          </div>

          <div className="w-12 h-12 bg-blue-600/15 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Restricted Access
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              Event Management Portal
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            This area is limited to authorized administrators and judges only. Please sign in with your credentials and a 2FA code.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-medium mb-6 flex items-start gap-2.5 ${
            isRateLimited 
              ? 'bg-amber-950/60 border border-amber-800 text-amber-300' 
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
              <Mail size={15} className="absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
              <Lock size={15} className="absolute left-3 top-3 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Authenticator Code (6-digit TOTP) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Authenticator code (TOTP)
              </label>
              <button
                type="button"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer"
              >
                Use authenticator app
              </button>
            </div>

            {/* 6 Digit Input Boxes */}
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
                  className="w-full h-11 text-center font-mono font-bold text-lg bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isRateLimited}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying MFA...' : 'Sign in'}</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Audit Trail Security Notice */}
          <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5 mt-4">
            <ShieldCheck size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All administrative sessions are logged via Elasticsearch and audited for security.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-center pt-2 text-[11px] text-slate-500">
              Local Dev Key: <span className="font-mono text-slate-400">PCCOE-DevOps-2026</span>
            </div>
          )}

        </form>

      </div>
    </div>
  );
}
