import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, MessageCircle, LogOut, Shield, ChevronDown, Home, UserPlus, Sparkles, Smartphone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

/**
 * Premium Edge-to-Edge Navbar Layout Component
 * Engineered to accommodate full-viewport displays, prevent layout squishing, 
 * and layer cleanly over dynamic background elements (like scroll ropes).
 */
export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { workspaces, activeWorkspace } = useWorkspace();
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLanding = location.pathname === '/';
  const isKenny = location.pathname === '/kenny';
  const isDashboard = location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/active-workspace') || 
                      location.pathname.startsWith('/new-workspace');

  // Handle scroll for dynamic glassmorphism
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    closeMobileNav();
    navigate('/');
  };

  return (
    <header 
      className={cn(
        "fixed top-0 inset-x-0 z-[60] w-full transition-all duration-500 ease-out",
        isScrolled 
          ? "bg-[#020617]/80 backdrop-blur-2xl border-b border-white/10 py-4 shadow-2xl" 
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
        
        {/* ==============================================================
            LEFT: High-Fidelity Logo Mark
            Fixed: Logo always routes to "/" (Landing Page)
            ============================================================== */}
        <Link to="/" className="flex items-center gap-4 group select-none shrink-0" onClick={closeMobileNav}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 p-[1.5px] shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-500">
            <div className="w-full h-full bg-[#050505] rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white stroke-[2]" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-sans font-bold text-2xl leading-none text-white tracking-tight">GaitAuth</span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-indigo-400 font-semibold mt-1.5">Smart Access</span>
          </div>
        </Link>

        {/* ==============================================================
            CENTER: Flexbox-Balanced Navigation (Zero Overlap)
            ============================================================== */}
        {(isLanding || location.pathname === '/android') && (
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-5 xl:gap-7 min-w-0">
            <a href="/#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors whitespace-nowrap">Capabilities</a>
            <a href="/#how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors whitespace-nowrap">How it Works</a>
            <Link 
              to="/android" 
              className={cn(
                "text-sm font-medium transition-all px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap",
                location.pathname === '/android' 
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.25)]" 
                  : "text-white/80 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Android</span>
            </Link>
            <a href="/#security" className="text-sm font-medium text-white/60 hover:text-white transition-colors whitespace-nowrap">Security</a>
          </nav>
        )}

        {isKenny && (
          <div className="hidden lg:flex flex-1 justify-center">
            <Badge variant="info" pulsing className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5">
              Kenny AI Active
            </Badge>
          </div>
        )}

        {/* ==============================================================
            RIGHT: Contextual Controls & Profile
            ============================================================== */}
        <div className="hidden md:flex items-center gap-2.5 xl:gap-3 shrink-0">
          {!isAuthenticated ? (
            /* Case 1: Guest / Unauthenticated Visitor -> Sign In + Sign Up */
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="md"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-medium px-5"
                >
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  variant="primary" 
                  size="md" 
                  icon={ArrowRight} 
                  className="shadow-[0_0_20px_rgba(155,107,255,0.35)] font-semibold text-[#07070C] bg-[#9B6BFF] hover:bg-[#8B55FF] border-none hover:scale-105 transition-all px-6"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          ) : (
            /* Case 2: Logged-in User */
            <div className="flex items-center gap-3">
              {/* Dashboard-Only Action Suite: Add Members & Kenny AI shortcut */}
              {isDashboard ? (
                <>
                  <Link to="/onboarding">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#100A1C] bg-[#A477FF] hover:bg-[#B18BFF] transition-all cursor-pointer shadow-[0_0_15px_rgba(164,119,255,0.25)] hover:scale-105 active:scale-95"
                      title="Add more employees to your organization"
                    >
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Add Members</span>
                    </button>
                  </Link>

                  <Link to="/dashboard">
                    <Button 
                      variant="secondary" 
                      size="md" 
                      className="bg-white/10 border-white/20 text-white shadow-sm border text-xs font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>

                  <Link to="/kenny">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-500/50 text-indigo-300 hover:text-white hover:bg-indigo-500/20 shadow-sm hover:scale-105 active:scale-95"
                      title="Open Kenny AI Security Assistant"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                      <span>Kenny AI</span>
                      <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                        AI
                      </span>
                    </button>
                  </Link>
                </>
              ) : (
                /* Non-Dashboard Pages (Landing, Kenny, Android): Show Dashboard + Kenny shortcut */
                <>
                  <Link to="/dashboard">
                    <Button 
                      variant="secondary" 
                      size="md" 
                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-medium flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  {!isKenny && (
                    <Link to="/kenny">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border bg-indigo-500/10 border-indigo-500/25 hover:border-indigo-500/50 text-indigo-300 hover:text-white hover:bg-indigo-500/20 shadow-sm hover:scale-105 active:scale-95"
                        title="Open Kenny AI Security Assistant"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                        <span>Kenny AI</span>
                      </button>
                    </Link>
                  )}
                </>
              )}

              {/* User Profile Pill */}
              <div
                className="flex items-center gap-3 pl-2 border-l border-white/10"
                title={`${user?.name || "Admin"} (${user?.organization || "Organization"})`}
              >
                <div className="w-9 h-9 rounded-full bg-[#12131C] border border-white/15 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                  {user?.avatar || "A"}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name || "Admin"}</span>
                  <span className="text-[10px] text-white/40 font-mono truncate max-w-[120px]">{user?.organization || "Organization"}</span>
                </div>
              </div>

              {/* Prominent Log Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95"
                title="Log out of your account"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* ==============================================================
            MOBILE: Hamburger Toggle
            ============================================================== */}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="md:hidden p-2.5 text-white/70 hover:text-white rounded-xl bg-white/5 border border-white/10 transition-colors"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ==============================================================
          MOBILE: Glass Sheet Navigation
          ============================================================== */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[#020617]/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {(isLanding || location.pathname === '/android') && (
                <div className="flex flex-col gap-5 border-b border-white/10 pb-6">
                  <a href="/#features" onClick={closeMobileNav} className="text-lg font-medium text-white/70 hover:text-white">Capabilities</a>
                  <a href="/#how-it-works" onClick={closeMobileNav} className="text-lg font-medium text-white/70 hover:text-white">How it Works</a>
                  <Link to="/android" onClick={closeMobileNav} className="text-lg font-medium text-indigo-300 hover:text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    <span>Android Application</span>
                  </Link>
                  <a href="/#security" onClick={closeMobileNav} className="text-lg font-medium text-white/70 hover:text-white">Enterprise Security</a>
                  {isAuthenticated && (
                    <Link to="/kenny" onClick={closeMobileNav} className="text-lg font-medium text-indigo-400">Talk to Kenny</Link>
                  )}
                </div>
              )}
              
              {!isAuthenticated ? (
                /* Case 1: Unauthenticated mobile -> Log In + Sign Up */
                <div className="flex flex-col gap-3 pt-2">
                  <Link to="/login" onClick={closeMobileNav}>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-center bg-white/5 border-white/10 hover:bg-white/10 text-white py-4 text-base font-semibold"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={closeMobileNav}>
                    <Button 
                      variant="primary" 
                      className="w-full justify-center bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] py-4 text-base font-bold shadow-[0_0_20px_rgba(155,107,255,0.4)]" 
                      icon={ArrowRight}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Case 2: Authenticated mobile -> Profile + Dashboard + Log Out */
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-4 py-4 border-b border-white/10">
                    <div className="w-12 h-12 rounded-full bg-[#9B6BFF] p-[2px] flex items-center justify-center text-[#07070C] font-bold text-base">
                      {user?.avatar || "A"}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white tracking-tight">{user?.name || "System Admin"}</div>
                      <div className="text-xs text-white/50 font-mono mt-0.5">{user?.organization || "Organization"}</div>
                    </div>
                  </div>
                  
                  <Link to="/onboarding" onClick={closeMobileNav} className="text-base font-semibold text-[#A477FF] hover:text-[#B18BFF] py-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Team Members</span>
                  </Link>

                  <Link to="/dashboard" onClick={closeMobileNav} className="text-base font-medium text-white/90 hover:text-white py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Command Dashboard
                    </span>
                    <span className="text-xs text-white/40 font-mono">Overview</span>
                  </Link>

                  <Link to="/kenny" onClick={closeMobileNav} className="text-base font-medium text-indigo-300 hover:text-indigo-200 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Kenny AI Assistant
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
                  </Link>

                  <Link to="/active-workspace" onClick={closeMobileNav} className="text-base font-medium text-white/70 hover:text-white py-2">
                    Live Security Feed
                  </Link>
                  
                  <Button 
                    variant="danger" 
                    size="lg" 
                    onClick={handleLogout} 
                    className="mt-2 justify-center bg-rose-500/10 text-rose-300 border border-rose-500/20 py-4 font-semibold" 
                    icon={LogOut}
                  >
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;