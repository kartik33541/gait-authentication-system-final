import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Download, ArrowRight, ShieldCheck, Zap, Activity, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GradientText } from '../ui/GradientText';

/**
 * AndroidSection Component
 * Landing page showcase for the GaitAuth Android mobile application.
 * Highlights the pocket passkey experience, app interface, and quick APK access.
 */
export const AndroidSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const openAuthGateModal = useUiStore((s) => s.openAuthGateModal);

  return (
    <section id="android" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 z-10 relative">
      <div className="relative rounded-3xl p-8 md:p-14 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 overflow-hidden shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Information & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div>
              <Badge variant="info" pulsing className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20 mb-3">
                <Smartphone className="w-3.5 h-3.5 mr-1.5 inline" /> Android Application
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight mt-2">
                Your everyday smartphone is your <GradientText>frictionless passkey.</GradientText>
              </h2>
            </div>

            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              No badges to tap, no security fobs to carry, and no camera surveillance. The GaitAuth Android companion app continuously reads your natural walking rhythm from your pocket, unlocking speed gates and doors before you even break stride.
            </p>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Sub-Second</span>
                  <span className="text-[11px] text-white/50">Instant gate trigger</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Zero Cameras</span>
                  <span className="text-[11px] text-white/50">100% private biometric</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Ultra Lightweight</span>
                  <span className="text-[11px] text-white/50">&lt; 4 MB install footprint</span>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate('/android')}
                className="bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] font-semibold px-8 py-5 rounded-full shadow-[0_0_30px_rgba(155,107,255,0.35)]"
              >
                App Details & Guide
              </Button>

              {isAuthenticated ? (
                <a
                  href="/downloads/Gait_Auth_Live.apk"
                  download="Gait_Auth_Live.apk"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download APK (3.8 MB)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openAuthGateModal({
                      featureName: 'GaitAuth Live APK',
                      description:
                        'Verify your organization session to download the production Android application binary.',
                      redirectTo: '/android',
                    })
                  }
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Sign In to Download APK</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: App Mockup & Card */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group w-full max-w-[280px]"
            >
              {/* Glowing Phone Outer Shell */}
              <div className="relative rounded-[40px] p-2.5 bg-gradient-to-b from-white/20 via-white/5 to-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.25)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_60px_rgba(155,107,255,0.4)] transition-all duration-500">
                {/* Phone Speaker Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#0a0a0f] rounded-full z-20 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-white/20 rounded-full" />
                </div>

                {/* Screen Container */}
                <div className="rounded-[32px] overflow-hidden bg-[#07070C] border border-white/10 relative shadow-inner">
                  <img
                    src="/mobile/AppScreen.png"
                    alt="GaitAuth Android App Interface"
                    className="w-full h-auto object-contain block group-hover:scale-[1.02] transition-transform duration-500"
                  />

                  {/* Clean Bottom Overlay */}
                  <div className="absolute inset-x-0 bottom-0 px-3.5 py-2.5 bg-gradient-to-t from-[#07070C] via-[#07070C]/90 to-transparent flex items-center justify-between">
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      GaitAuth Mobile
                    </div>
                    <span className="text-[10px] font-mono text-white/50">
                      v2.4 Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Pill Tag */}
              <div className="absolute -bottom-3 -right-3 px-3.5 py-1.5 rounded-xl bg-[#0f111a]/95 border border-indigo-500/40 shadow-xl flex items-center gap-2 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-mono text-indigo-300 font-semibold">Motion Sync Ready</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AndroidSection;

