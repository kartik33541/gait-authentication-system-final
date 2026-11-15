import React from 'react';
import { 
  Smartphone, 
  Download, 
  ShieldCheck, 
  Zap, 
  Activity, 
  FileCode, 
  Layers, 
  Cpu, 
  Lock, 
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../store/uiStore';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Badge } from '../components/ui/Badge';
import { GradientText } from '../components/ui/GradientText';
import { Footer } from '../components/layout/Footer';

/**
 * AndroidApp Page Component
 * Detailed showcase, technical implementation, and auth-gated download repository
 * for the official GaitAuth Android mobile client.
 */
export const AndroidApp = () => {
  const { isAuthenticated } = useAuth();
  const openAuthGateModal = useUiStore((s) => s.openAuthGateModal);

  const promptAuthForResource = (featureName, description) => {
    openAuthGateModal({
      featureName,
      description,
      redirectTo: '/android',
    });
  };

  const downloads = [
    {
      id: 'live',
      title: 'GaitAuth Live APK',
      badge: 'Recommended',
      badgeVariant: 'success',
      filename: 'Gait_Auth_Live.apk',
      size: '3.77 MB',
      version: 'v2.4 Production',
      description: 'The standard production build for employee smartphones. Connects to the live cloud perimeter for continuous contactless access.',
      downloadUrl: '/downloads/Gait_Auth_Live.apk',
      isPrimary: true,
    },
    {
      id: 'flask2',
      title: 'GaitAuth Staging APK',
      badge: 'Local Testing',
      badgeVariant: 'warning',
      filename: 'GaitAuth Flask2.apk',
      size: '3.77 MB',
      version: 'v2.4 Staging / Dev',
      description: 'Preconfigured for local network test environments and intranet perimeter gateways.',
      downloadUrl: '/downloads/GaitAuth Flask2.apk',
      isPrimary: false,
    },
    {
      id: 'package',
      title: 'Complete Android Package (.ZIP)',
      badge: 'Full Distribution',
      badgeVariant: 'info',
      filename: 'GaitAuth_Android_Package.zip',
      size: '7.24 MB',
      version: 'Full Archive',
      description: 'Contains both APK builds, MIT App Inventor (.aia) source project, logic block schematics, and sensor calibration documentation.',
      downloadUrl: '/downloads/GaitAuth_Android_Package.zip',
      isPrimary: false,
    },
  ];

  const features = [
    {
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      title: "Hardware IMU Polling (~38Hz)",
      description: "Direct access to 3-axis accelerometer and gyroscope at hardware rate, capturing micro-kinetics like stride impact, pelvic roll, and heel-strike cadence."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "Sub-Second Gate Pairing",
      description: "Low-latency background pairing primes perimeter turnstiles and security doors before the employee reaches the barrier."
    },
    {
      icon: <Lock className="w-5 h-5 text-fuchsia-400" />,
      title: "Zero Video or Camera Storage",
      description: "100% privacy compliant. GaitAuth does not request camera, microphone, or continuous GPS permissions—only standard motion sensors."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: "Real-World Kinetic Guard",
      description: "Enforces standard walking energy validation. Rejects static device shaking, table agitation, and video replay attacks instantly."
    }
  ];

  const installSteps = [
    {
      step: "01",
      title: "Download APK File",
      description: "Tap the download button below directly on your Android phone, or transfer the .apk file from your computer."
    },
    {
      step: "02",
      title: "Allow Unknown Sources",
      description: "When prompted by Android, grant your browser or file manager permission to 'Install unknown apps' in Settings."
    },
    {
      step: "03",
      title: "Install & Launch",
      description: "Tap 'Install' and launch GaitAuth. Grant standard motion sensor permission when requested."
    },
    {
      step: "04",
      title: "Pair Passkey & Walk",
      description: "Enter your employee passkey or scan your facility QR code. Complete a quick 60-second baseline walk to activate access."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#050505] text-white">
      {/* =========================================================
          HERO SECTION
          ========================================================= */}
      <section className="relative w-full overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 px-4 md:px-8 flex flex-col items-center justify-center text-center">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <Badge variant="info" pulsing className="px-5 py-2 text-xs font-mono uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Smartphone className="w-3.5 h-3.5 mr-2 inline" />
            Official Android Application • v2.4
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Your smartphone is your <GradientText>contactless passkey.</GradientText>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Download the native GaitAuth Android companion app. Turn everyday walking motion into an unforgeable, contactless digital passkey for smart doors and perimeter turnstiles.
          </p>

          {/* Quick Action CTA Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <a
                href="/downloads/Gait_Auth_Live.apk"
                download="Gait_Auth_Live.apk"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] font-semibold text-base shadow-[0_0_35px_rgba(155,107,255,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-5 h-5" />
                <span>Download Live APK (3.8 MB)</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  promptAuthForResource(
                    'GaitAuth Live APK',
                    'Sign in or create an organization account to download verified enterprise APK binaries.'
                  )
                }
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] font-semibold text-base shadow-[0_0_35px_rgba(155,107,255,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Download APK</span>
              </button>
            )}

            <a
              href="#downloads-hub"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-medium transition-colors"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>View Packages & Guide</span>
            </a>
          </div>

          {/* Micro Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs font-mono text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Android 8.0 to 15 Ready
            </span>
            <span>•</span>
            <span>ARM64 & x86 Architecture</span>
            <span>•</span>
            <span>No Root Required</span>
            <span>•</span>
            <span className="text-emerald-400">Zero Cameras / Zero Video</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          VISUAL SHOWCASE & INTERFACE DEEP DIVE
          ========================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 z-10 relative">
        <div className="rounded-3xl p-8 md:p-14 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 shadow-2xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Phone Mockup with AppScreen.png */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group w-full max-w-[280px]">
                {/* Ambient glow behind mockup */}
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-[44px] blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" />

                {/* Smartphone Chassis */}
                <div className="relative rounded-[40px] p-2.5 bg-gradient-to-b from-white/20 via-white/5 to-white/15 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
                  {/* Speaker Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#0a0a0f] rounded-full z-20 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-white/20 rounded-full" />
                  </div>

                  {/* High-res Screen Display */}
                  <div className="rounded-[32px] overflow-hidden bg-[#07070C] border border-white/10 relative shadow-inner">
                    <img
                      src="/mobile/AppScreen.png"
                      alt="GaitAuth Android App Screen"
                      className="w-full h-auto object-contain block group-hover:scale-[1.01] transition-transform duration-500"
                    />

                    {/* Live Status Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#07070C] via-[#07070C]/90 to-transparent flex items-center justify-between">
                      <div>
                        <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          GaitAuth Mobile Live
                        </div>
                        <div className="text-[10px] text-white/50">MIT App Inventor / Android Native</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Telemetry Callout */}
                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl bg-[#0e1017]/95 border border-indigo-500/40 shadow-xl flex items-center gap-2 backdrop-blur-md">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-mono text-white font-medium">38Hz Sensor Sync</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Highlights & Feature Cards */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-indigo-400 font-semibold">
                  INTELLIGENT MOBILE ARCHITECTURE
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">
                  Engineered for seamless pocket operation.
                </h2>
              </div>

              <p className="text-white/70 text-base leading-relaxed">
                The GaitAuth Android application operates quietly in the background without requiring users to unlock their phone, open an app at the turnstile, or look into a facial recognition camera.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {features.map((feat, idx) => (
                  <GlassPanel key={idx} className="p-5 border-white/10 bg-white/[0.02] flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {feat.icon}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{feat.title}</h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mt-1">
                      {feat.description}
                    </p>
                  </GlassPanel>
                ))}
              </div>

              {/* Architecture Logic Inspection Card */}
              <div className="mt-4 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Full Event Transmission Logic Included</h4>
                    <p className="text-xs text-white/60">Built with robust background timers, error buffers, and token handshakes.</p>
                  </div>
                </div>
                {isAuthenticated ? (
                  <a
                    href="/mobile/logic.png"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-indigo-300 hover:text-white transition-colors shrink-0"
                  >
                    <span>Inspect Logic Diagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      promptAuthForResource(
                        'Architecture Logic Diagram',
                        'Internal event-loop transmission schematics are reserved for signed-in workspace members.'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-amber-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to View Logic</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          DOWNLOAD REPOSITORY & APK HUB
          ========================================================= */}
      <section id="downloads-hub" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-indigo-400 font-semibold block mb-2">
            OFFICIAL BINARIES & ARTIFACTS
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Download the Android <GradientText>application package.</GradientText>
          </h2>
          <p className="text-white/60 text-base">
            Choose the build optimized for your deployment. Individual APKs or the full developer and source code archive.
          </p>
        </div>

        {/* Auth Lock Notice for Non-Logged-In Visitors */}
        {!isAuthenticated && (
          <div className="max-w-3xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">Authentication Required for Binary Downloads</h4>
                <p className="text-xs text-amber-200/75 mt-0.5">
                  Sign in with your organization account to unlock verified APK files and deployment packages.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                promptAuthForResource(
                  'Enterprise APK Repository',
                  'Authenticate with your organization workspace to unlock APK binaries and project archives.'
                )
              }
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#07070C] font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              Sign In to Unlock
            </button>
          </div>
        )}

        {/* 3 Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {downloads.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl p-7 flex flex-col justify-between border transition-all duration-300 shadow-xl ${
                item.isPrimary
                  ? 'bg-gradient-to-b from-indigo-950/40 to-purple-950/20 border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.2)]'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    {item.id === 'package' ? <FileCode className="w-6 h-6 text-indigo-400" /> : <Smartphone className="w-6 h-6 text-purple-400" />}
                  </div>
                  <Badge variant={item.badgeVariant} className="text-[10px] font-mono uppercase tracking-wider">
                    {item.badge}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <div className="text-xs font-mono text-white/50 mb-3">{item.version}</div>

                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div>
                <div className="pt-4 pb-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50 mb-4">
                  <span>File: {item.filename}</span>
                  <span className="text-white font-semibold">{item.size}</span>
                </div>

                {isAuthenticated ? (
                  <a
                    href={item.downloadUrl}
                    download={item.filename}
                    className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 ${
                      item.isPrimary
                        ? 'bg-[#9B6BFF] hover:bg-[#8B55FF] text-[#07070C] shadow-[0_0_25px_rgba(155,107,255,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/15 hover:border-white/25 active:scale-[0.98]'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {item.id === 'package' ? 'Archive' : 'APK'}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      promptAuthForResource(
                        item.title,
                        `Please sign in or create an organization account to download ${item.filename} (${item.size}).`
                      )
                    }
                    className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 hover:border-amber-400/50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Download</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          INSTALLATION & SIDELOADING GUIDE
          ========================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 z-10 relative">
        <div className="rounded-3xl p-8 md:p-14 bg-white/[0.02] border border-white/10">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-emerald-400 font-semibold block mb-2">
              STEP-BY-STEP SIDELOADING GUIDE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              How to install & pair the APK.
            </h2>
            <p className="text-white/60 text-sm mt-2">
              Android security prompts you when installing enterprise apps directly. Follow these 4 simple steps to get started in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {installSteps.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1.5px] mb-4">
                    <div className="w-full h-full bg-[#07070C] rounded-[10px] flex items-center justify-center font-mono font-bold text-xs text-white">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sideloading Notice */}
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/80">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Enterprise Sideloading Note:</strong> Depending on your Android version (Samsung One UI, Google Pixel, Xiaomi MIUI), the prompt will say <em>"For your security, your phone is not allowed to install unknown apps from this source"</em>. Tap <strong>Settings</strong> and toggle on <strong>Allow from this source</strong> to complete the install.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================
          TECHNICAL SPECIFICATIONS TABLE
          ========================================================= */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 py-16 z-10 relative">
        <h3 className="text-xl font-bold text-white text-center mb-8">Technical Specifications</h3>
        
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 text-sm">
            <div className="p-5 flex flex-col gap-3">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Minimum Android Version</span>
                <span className="font-mono text-white">Android 8.0 (API 26, Oreo)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Target Android Version</span>
                <span className="font-mono text-white">Android 14 / 15 (API 34/35)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Supported Architectures</span>
                <span className="font-mono text-white">arm64-v8a, armeabi-v7a, x86_64</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/50">APK Footprint</span>
                <span className="font-mono text-white">3.77 MB (Under 15MB installed)</span>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Sensors Required</span>
                <span className="font-mono text-white">3-Axis Accelerometer, Gyroscope</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Sampling Frequency</span>
                <span className="font-mono text-white">~38Hz hardware polling rate</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Network Transmission</span>
                <span className="font-mono text-white">Encrypted HTTPS / WebSockets</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/50">Battery Impact</span>
                <span className="font-mono text-emerald-400">&lt; 1.2% per 8-hour shift</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page Footer */}
      <Footer />
    </div>
  );
};

export default AndroidApp;

