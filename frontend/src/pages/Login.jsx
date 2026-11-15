import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  KeyRound,
  X,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Enterprise-grade Login Page for GaitAuth.
 * Features 500px card, 3D perspective grid, stippled halftone dot matrix,
 * Caps Lock detection, true session/local persistence, and a dedicated Password Reset Modal.
 */
export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, login, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect') || location.state?.from?.pathname || '';
  const safeRedirectTarget = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) ? rawRedirect : '/dashboard';
  const hasProtectedRedirect = Boolean(rawRedirect && rawRedirect !== '/dashboard' && rawRedirect !== '/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'github' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(safeRedirectTarget, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, safeRedirectTarget]);

  // Handle 60s cooldown countdown for Password Reset
  useEffect(() => {
    let timer;
    if (resetCooldown > 0) {
      timer = setInterval(() => {
        setResetCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const handleKeyModifier = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your master password.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email: cleanEmail, password, rememberMe });
      navigate(safeRedirectTarget, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let friendlyError = 'Invalid credentials. Please verify your email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'Incorrect email or password. Please try again or reset your password.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = 'Too many failed login attempts. Access is temporarily locked. Please reset your password or try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = 'Network connection failure. Please verify your internet connection.';
      } else if (err.message) {
        friendlyError = err.message;
      }
      setErrorMessage(friendlyError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (providerName) => {
    try {
      setOauthLoading(providerName);
      setErrorMessage('');
      setInfoMessage('');
      const action = providerName === 'google' ? loginWithGoogle : loginWithGithub;
      const result = await action();
      if (result?.isNewUser) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(safeRedirectTarget, { replace: true });
      }
    } catch (err) {
      console.error(`${providerName} login error:`, err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        setErrorMessage(`An account already exists with this email using password sign-in. Please log in with your email and password.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} sign-in is not activated yet in Firebase Console. Please log in with your work email.`);
      } else {
        setErrorMessage(err.message || `Failed to sign in with ${providerName}.`);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail(email.trim().toLowerCase());
    setResetMessage({ type: '', text: '' });
    setIsResetModalOpen(true);
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (resetCooldown > 0) return;

    const cleanEmail = resetEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setResetMessage({ type: 'error', text: 'Please enter a valid work email address.' });
      return;
    }

    try {
      setResetSubmitting(true);
      setResetMessage({ type: '', text: '' });
      await resetPassword(cleanEmail);
      
      // OWASP Blind Confirmation
      setResetMessage({
        type: 'success',
        text: `If an account is associated with ${cleanEmail}, a secure password reset link has been dispatched. Please check your inbox and spam folder.`
      });
      // Start 60s cooldown to prevent email flooding
      setResetCooldown(60);
    } catch (err) {
      console.error('Password reset error:', err);
      setResetMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch reset email. Please try again.'
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07070C] text-[#F5F6FA] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-[#9B6BFF]/30 selection:text-white">
      
      {/* 1. Subtle 3D Perspective Coordinate Grid */}
      <div className="absolute inset-0 bg-grid-perspective pointer-events-none z-0" />

      {/* 2. Atmospheric Top Radial Glow in Electric Violet */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[480px] bg-[#9B6BFF]/12 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Centered Enlarged Card (500px width with micro-patterns) */}
      <div className="w-full max-w-[500px] bg-[#0E0F17]/95 border border-white/[0.09] rounded-[32px] p-8 sm:p-11 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden z-10 flex flex-col">
        
        {/* Top Edge Gradient Reflection */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

        {/* Stippled Halftone Dot Matrix Texture at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-dot-matrix opacity-70 pointer-events-none rounded-b-[32px] z-0" />

        {/* Card Content Container */}
        <div className="relative z-10 flex flex-col">

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <Link to="/" className="inline-flex items-center justify-center mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-[#9B6BFF] flex items-center justify-center text-[#07070C] shadow-[0_0_25px_rgba(155,107,255,0.45)] transition-transform group-hover:scale-105">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Log in to GaitAuth
            </h1>
            <p className="text-xs text-white/50 mt-1.5">
              Access your enterprise security perimeter
            </p>
          </div>

          {/* Social Login Options */}
          <div className="grid grid-cols-2 gap-3.5 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={submitting || oauthLoading !== null}
              className="w-full h-11 bg-[#151621] hover:bg-[#1D1E2D] border border-white/10 hover:border-white/20 active:scale-[0.98] text-white text-xs font-medium px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#9B6BFF]" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.56 0 2.97.57 4.08 1.5l3.06-3.06C17.3 1.7 14.85 1 12 1 7.42 1 3.52 3.59 1.62 7.37l3.75 2.91C6.27 7.55 8.9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.89c2.18-2.01 3.7-4.97 3.7-8.71z"/>
                  <path fill="#FBBC05" d="M5.37 14.72c-.24-.72-.37-1.49-.37-2.72s.13-2 .37-2.72L1.62 6.37C.59 8.44 0 10.66 0 12s.59 3.56 1.62 5.63l3.75-2.91z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.96-1.07 7.95-2.91l-3.72-2.89c-1.07.72-2.45 1.16-4.23 1.16-3.1 0-5.73-2.55-6.63-5.28L1.62 16.09C3.52 19.87 7.42 23 12 23z"/>
                </svg>
              )}
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={submitting || oauthLoading !== null}
              className="w-full h-11 bg-[#151621] hover:bg-[#1D1E2D] border border-white/10 hover:border-white/20 active:scale-[0.98] text-white text-xs font-medium px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#9B6BFF]" />
              ) : (
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              )}
              <span>Github</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#0E0F17] px-3.5 text-[11px] text-white/40 uppercase tracking-widest absolute">
              Or
            </span>
          </div>

          {/* Feedback Banners */}
          {hasProtectedRedirect && !errorMessage && !infoMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>Authentication required — sign in with your workspace account to continue.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Work Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-white/70">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="text-xs text-[#9B6BFF] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleKeyModifier}
                  onKeyDown={handleKeyModifier}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-11 text-sm text-white placeholder-white/25 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Caps Lock Warning */}
              {capsLockOn && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox (Real Session / Local Persistence) */}
            <div className="flex items-center gap-2.5 mt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#14151F] border-white/20 text-[#9B6BFF] focus:ring-[#9B6BFF] focus:ring-offset-0 accent-[#9B6BFF] cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-white/70 cursor-pointer select-none">
                Remember Me <span className="text-[11px] text-white/40 font-light">(keep session active)</span>
              </label>
            </div>

            {/* Submit Button (Electric Violet #9B6BFF) */}
            <button
              type="submit"
              disabled={submitting || oauthLoading !== null}
              className="w-full h-12 mt-2 bg-[#9B6BFF] hover:bg-[#8B55FF] active:bg-[#7B40FF] text-[#07070C] font-semibold text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(155,107,255,0.35)] hover:shadow-[0_0_35px_rgba(155,107,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#07070C]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>

          </form>

          {/* Switch to Sign Up */}
          <div className="text-center text-xs text-white/60 mt-7 pt-5 border-t border-white/5">
            Do not have an account?{' '}
            <Link 
              to={hasProtectedRedirect ? `/signup?redirect=${encodeURIComponent(safeRedirectTarget)}` : "/signup"} 
              className="text-[#9B6BFF] hover:underline font-semibold ml-1"
            >
              Sign Up
            </Link>
          </div>

        </div>

      </div>

      {/* =========================================================
          PASSWORD RESET MODAL (Superlist-style design matching Card)
          ========================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          
          <div className="w-full max-w-[460px] bg-[#0E0F17]/98 border border-white/10 rounded-[30px] p-7 sm:p-9 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            
            {/* Top Edge Gradient Reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

            {/* Stippled Halftone Dot Matrix at Modal Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-36 bg-dot-matrix opacity-70 pointer-events-none rounded-b-[30px] z-0" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all z-20 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Body */}
            <div className="relative z-10 flex flex-col">
              
              {/* Header Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#9B6BFF]/10 border border-[#9B6BFF]/20 flex items-center justify-center text-[#9B6BFF] mb-5 shadow-[0_0_20px_rgba(155,107,255,0.2)]">
                <KeyRound className="w-6 h-6" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                Enter your work email address. We'll dispatch a secure recovery link to reset your administrator credentials.
              </p>

              {/* Status Notifications */}
              {resetMessage.text && (
                <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  resetMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}>
                  {resetMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{resetMessage.text}</span>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleSendResetLink} className="flex flex-col gap-4 mt-5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Registered Work Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      autoFocus
                      className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Submit Reset Button with 60s cooldown */}
                <button
                  type="submit"
                  disabled={resetSubmitting || resetCooldown > 0}
                  className="w-full h-12 mt-1 bg-[#9B6BFF] hover:bg-[#8B55FF] active:bg-[#7B40FF] text-[#07070C] font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(155,107,255,0.3)] hover:shadow-[0_0_30px_rgba(155,107,255,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {resetSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#07070C]" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : resetCooldown > 0 ? (
                    <span>Resend available in {resetCooldown}s</span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="text-xs text-white/50 hover:text-white transition-colors text-center py-2 cursor-pointer"
                >
                  Return to Login
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Login;
