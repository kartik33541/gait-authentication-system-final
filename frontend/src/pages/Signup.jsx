import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Zap, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Loader2,
  ChevronDown,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Superlist-grade Signup Page for GaitAuth.
 * Features 560px card, 3D perspective grid, stippled halftone dot matrix,
 * live 4-stage password strength evaluation, Caps Lock detection, and strict enterprise sanitization.
 */
export const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, signup, loginWithGoogle, loginWithGithub } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect') || '';
  const safeRedirectTarget = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) ? rawRedirect : '/dashboard';
  const hasProtectedRedirect = Boolean(rawRedirect && rawRedirect !== '/dashboard' && rawRedirect !== '/');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'github' | null
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(safeRedirectTarget, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, safeRedirectTarget]);

  // Real-time password strength evaluator
  const evaluatePassword = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    };
    let score = 0;
    if (checks.length) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.number) score += 1;
    if (checks.symbol) score += 1;

    let label = 'Too weak';
    let color = 'bg-rose-500';
    if (score === 2) {
      label = 'Fair';
      color = 'bg-amber-400';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-indigo-400';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-[#9B6BFF]';
    }

    return { checks, score, label, color };
  };

  const passwordStrength = evaluatePassword(formData.password);

  const handleKeyModifier = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanFirst = formData.firstName.trim();
    const cleanLast = formData.lastName.trim();
    const cleanOrg = formData.organization.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Name Sanitization & Bounds
    if (!cleanFirst || !cleanLast) {
      setErrorMessage('Please provide both first and last name.');
      return;
    }
    if (cleanFirst.length < 2 || cleanFirst.length > 50 || cleanLast.length < 2 || cleanLast.length > 50) {
      setErrorMessage('Names must be between 2 and 50 characters.');
      return;
    }
    if (!nameRegex.test(cleanFirst) || !nameRegex.test(cleanLast)) {
      setErrorMessage('Names can only contain alphabetical letters, spaces, hyphens, and apostrophes.');
      return;
    }

    // 2. Company Sanitization
    if (!cleanOrg || cleanOrg.length < 2 || cleanOrg.length > 60) {
      setErrorMessage('Company/Organization name must be between 2 and 60 characters.');
      return;
    }

    // 3. Work Email RFC Validation
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid work email address (e.g. name@company.com).');
      return;
    }

    // 4. Password Policy Enforcement
    if (!passwordStrength.checks.length) {
      setErrorMessage('Master password must be at least 8 characters long.');
      return;
    }
    if (!passwordStrength.checks.uppercase || !passwordStrength.checks.number) {
      setErrorMessage('For security, master password must contain at least one uppercase letter and one number.');
      return;
    }

    try {
      setSubmitting(true);
      const fullName = `${cleanFirst} ${cleanLast}`;
      await signup({
        name: fullName,
        organization: cleanOrg,
        email: cleanEmail,
        password: formData.password
      });
      // Newly signed up admins go directly to onboarding to configure initial operatives
      navigate('/onboarding', { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      let friendlyError = 'Failed to create your account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'This work email is already registered. Please log in instead.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Please enter a valid work email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password is too weak. Please use at least 8 characters including numbers and letters.';
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
        setErrorMessage(`${providerName.charAt(0).toUpperCase() + providerName.slice(1)} sign-in is not activated yet in Firebase Console. Please register with your work email.`);
      } else {
        setErrorMessage(err.message || `Failed to sign in with ${providerName}.`);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07070C] text-[#F5F6FA] flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-16 relative overflow-x-hidden font-sans selection:bg-[#9B6BFF]/30 selection:text-white">
      
      {/* 1. Subtle 3D Perspective Coordinate Grid */}
      <div className="absolute inset-0 bg-grid-perspective pointer-events-none z-0" />

      {/* 2. Atmospheric Top Radial Glow in Electric Violet */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[#9B6BFF]/12 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-1/3 -left-48 w-[450px] h-[450px] bg-[#6366F1]/06 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main 2-Column Responsive Body */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-20 my-auto z-10 py-6">
        
        {/* =========================================================
            LEFT COLUMN: Brand & Clean Unboxed Value Proposition
            ========================================================= */}
        <div className="flex-1 flex flex-col max-w-xl lg:max-w-2xl">
          
          {/* Brand Logo Header */}
          <Link to="/" className="inline-flex items-center gap-3.5 group w-fit mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#9B6BFF] flex items-center justify-center text-[#07070C] shadow-[0_0_25px_rgba(155,107,255,0.45)] transition-transform group-hover:scale-105">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/90">GaitAuth</span>
          </Link>

          {/* Headline & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.12]">
            Start your 30-day free trial
          </h1>
          <div className="flex items-center gap-2.5 text-white/60 text-sm mt-3.5 mb-12">
            <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white/70" />
            </div>
            <span>No hardware sensors required</span>
          </div>

          {/* 3 Value Pillars (Unboxed, clean outline icons matching Image 3) */}
          <div className="flex flex-col gap-9">
            
            {/* Pillar 1 */}
            <div className="flex items-start gap-4">
              <UserCheck className="w-6 h-6 text-[#9B6BFF] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Hands-Free Walk-Through Access
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mt-1">
                  Authenticate team members continuously using their natural walking pattern — no badges, fobs, or scanning required.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-[#9B6BFF] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Instant Team Onboarding
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mt-1">
                  Enroll employees in seconds with standard smartphone motion recordings. Zero extra hardware needed.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-[#9B6BFF] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Built-In Motion Verification
                </h3>
                <p className="text-sm text-white/50 leading-relaxed mt-1">
                  Enterprise-grade zero-trust identity verified via deep Siamese neural dynamics and physics scoring.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: Enlarged 560px Superlist Card with Stipple Texture
            ========================================================= */}
        <div className="w-full lg:w-[560px] max-w-[560px] bg-[#0E0F17]/95 border border-white/[0.09] rounded-[32px] p-8 sm:p-11 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          
          {/* Top Edge Gradient Reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

          {/* Stippled Halftone Dot Matrix Texture at Bottom */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-dot-matrix opacity-70 pointer-events-none rounded-b-[32px] z-0" />

          {/* Card Inner Content Container */}
          <div className="relative z-10">

            {/* Social Auth Header */}
            <div className="text-center text-xs font-medium text-white/50 tracking-wide mb-3.5">
              Register with:
            </div>

            {/* Google & GitHub Buttons */}
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              {/* Google OAuth Button */}
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

              {/* GitHub OAuth Button */}
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

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    First Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      minLength={2}
                      maxLength={50}
                      required
                      className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Last Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      minLength={2}
                      maxLength={50}
                      required
                      className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Company / Organization */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Company Name
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp or Team"
                    minLength={2}
                    maxLength={60}
                    required
                    className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Work Email */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Work Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    className="w-full h-12 bg-[#14151F] border border-white/10 hover:border-white/15 focus:border-[#9B6BFF] focus:ring-1 focus:ring-[#9B6BFF] rounded-xl pl-10 pr-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Password with Live Strength Indicator */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Master Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-white/35 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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

                {/* Real-time 4-Stage Password Strength Indicator */}
                {formData.password ? (
                  <div className="flex flex-col gap-1.5 mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Security Rating:</span>
                      <span className={`font-semibold ${
                        passwordStrength.score <= 1 ? 'text-rose-400' :
                        passwordStrength.score === 2 ? 'text-amber-400' :
                        passwordStrength.score === 3 ? 'text-indigo-400' : 'text-[#9B6BFF]'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Segmented Strength Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            step <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Micro-requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[11px]">
                      <span className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.length ? 'text-emerald-400' : 'text-white/40'}`}>
                        <span>{passwordStrength.checks.length ? '✓' : '•'}</span> 8+ characters
                      </span>
                      <span className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.uppercase ? 'text-emerald-400' : 'text-white/40'}`}>
                        <span>{passwordStrength.checks.uppercase ? '✓' : '•'}</span> 1 uppercase letter
                      </span>
                      <span className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.number ? 'text-emerald-400' : 'text-white/40'}`}>
                        <span>{passwordStrength.checks.number ? '✓' : '•'}</span> 1 number
                      </span>
                      <span className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.symbol ? 'text-emerald-400' : 'text-white/40'}`}>
                        <span>{passwordStrength.checks.symbol ? '✓' : '•'}</span> 1 special symbol
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="block text-[11px] text-white/40 mt-1">
                    Minimum length is 8 characters (include at least 1 number and 1 uppercase letter).
                  </span>
                )}
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
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <span>Sign Up</span>
                )}
              </button>

            </form>

            {/* Disclaimer */}
            <p className="text-[11px] text-white/40 leading-relaxed text-center mt-5">
              By creating an account, you agree to the{' '}
              <span className="underline cursor-pointer hover:text-white/60">Terms of Service</span>. We'll occasionally send you account-related emails.
            </p>

            {/* Switch to Login */}
            <div className="text-center text-xs text-white/60 mt-6 pt-5 border-t border-white/5">
              Already have an account?{' '}
              <Link 
                to={hasProtectedRedirect ? `/login?redirect=${encodeURIComponent(safeRedirectTarget)}` : "/login"} 
                className="text-[#9B6BFF] hover:underline font-semibold ml-1"
              >
                Login
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* Desktop Bottom Bar */}
      <div className="hidden lg:flex items-center justify-between text-xs text-white/40 max-w-7xl mx-auto w-full pt-8 border-t border-white/5 z-10">
        <div className="flex items-center gap-6">
          <span className="hover:text-white/70 cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-white/70 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-white/70 cursor-pointer transition-colors">Docs</span>
          <span className="hover:text-white/70 cursor-pointer transition-colors">Help</span>
        </div>
        <div className="flex items-center gap-2 hover:text-white/70 cursor-pointer transition-colors">
          <Globe className="w-3.5 h-3.5" />
          <span>English</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

    </div>
  );
};

export default Signup;
