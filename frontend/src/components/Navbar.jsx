import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Mock User Data
  const user = { name: 'Kartik Rawat', role: 'System Architect', avatar: 'K' };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (['/', '/auth', '/kenny'].includes(location.pathname)) return null;

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Kenny AI', path: '/kenny' }
  ];

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300">
      <nav 
        className={`w-full flex items-center justify-between transition-all duration-500 ease-out px-8 lg:px-12 border-b bg-[#0a0a0c]/80 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${
          isScrolled 
            ? 'py-4 border-white/20 bg-[#0a0a0c]/95' 
            : 'py-6 border-white/5'
        }`}
      >
        
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">GaitAuth</span>
        </Link>

        {/* LINKS */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name}
                to={link.path}
                className={`relative px-6 py-2.5 rounded-xl text-[16px] font-display font-semibold transition-all duration-300 overflow-hidden group ${
                  isActive 
                    ? 'text-white bg-white/10' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></div>
                )}
                {link.name}
              </Link>
            )
          })}
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-4 pl-5 pr-2.5 py-2 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-base font-display font-medium text-white/90 group-hover:text-white">{user.name.split(' ')[0]}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
              {user.avatar}
            </div>
          </button>

          {/* DROPDOWN */}
          {profileOpen && (
            <div className="absolute right-0 mt-4 w-60 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden animate-fade-in-down origin-top-right">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <p className="text-sm font-display font-semibold text-white">{user.name}</p>
                <p className="text-xs font-mono tracking-widest text-white/40 mt-1 uppercase">{user.role}</p>
              </div>
              <div className="p-2">
                <button onClick={() => {}} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-display font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  Settings
                </button>
                <button onClick={() => {}} className="w-full flex items-center gap-3 mt-1 px-3 py-2.5 text-sm font-display font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border-t border-white/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;