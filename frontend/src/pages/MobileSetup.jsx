import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Activity
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const MobileSetup = () => {
  const [searchParams] = useSearchParams();
  const rawTenant = searchParams.get('tenant') || searchParams.get('t') || 'COMP-05PC4G-2026';
  const rawEmp = searchParams.get('emp') || searchParams.get('e') || searchParams.get('template') || 'EMP-001';

  const tenantId = rawTenant.trim();
  const employeeId = rawEmp.trim();
  const passkeyString = `${tenantId}:${employeeId}`;

  const [employeeName, setEmployeeName] = useState('');
  const [companyName, setCompanyName] = useState('Ram Chandra and Sons');
  const [copiedPasskey, setCopiedPasskey] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employee record and company name from Firestore if available
  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      try {
        if (tenantId) {
          const orgSnap = await getDoc(doc(db, 'organizations', tenantId));
          if (isMounted && orgSnap.exists()) {
            const orgData = orgSnap.data();
            if (orgData.company_name) setCompanyName(orgData.company_name);
          }
        }

        if (tenantId && employeeId) {
          const empSnap = await getDoc(doc(db, 'organizations', tenantId, 'employees', employeeId));
          if (isMounted && empSnap.exists()) {
            const empData = empSnap.data();
            if (empData.name) setEmployeeName(empData.name);
          }
        }
      } catch (err) {
        console.warn("Setup lookup notice:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInfo();
    return () => { isMounted = false; };
  }, [tenantId, employeeId]);

  const displayName = employeeName || (employeeId === 'EMP-001' ? 'Jensen Doe' : 'Team Member');

  const handleCopyPasskey = () => {
    navigator.clipboard.writeText(passkeyString);
    setCopiedPasskey(true);
    toast.success("Passkey copied! Open the GaitAuth app and tap Paste.");
    setTimeout(() => setCopiedPasskey(false), 3000);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090D] text-[#F5F5FA] font-sans antialiased px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-between items-center relative overflow-hidden">
      
      {/* Background Subtle Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container (Centered, max-w-md for smartphone perfection) */}
      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">

        {/* Brand Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight leading-none block">
                GaitAuth
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                Contactless Security Perimeter
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{isLoading ? 'Syncing...' : 'Ready to Pair'}</span>
          </div>
        </div>

        {/* Hero Greeting Card */}
        <div className="p-6 rounded-3xl bg-[#111118] border border-white/10 shadow-2xl space-y-3 relative overflow-hidden text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A477FF] font-mono">
              Employee Access Invitation
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
              {employeeId}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Welcome, {displayName}!
          </h1>

          <p className="text-xs text-white/60 leading-relaxed font-light">
            You are enrolled in the contactless perimeter system for <strong className="text-white">{companyName}</strong>. You can unlock company doors simply by walking with your smartphone in your pocket.
          </p>

          <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-white/40 border-t border-white/5">
            <span>Facility: {companyName}</span>
            <span>•</span>
            <span className="text-indigo-400">30-Second Setup</span>
          </div>
        </div>

        {/* =========================================================
            STEP 1: DOWNLOAD APP
            ========================================================= */}
        <div className="p-6 rounded-3xl bg-[#111118] border border-white/10 shadow-xl space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold font-mono text-sm">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Download the GaitAuth App
              </h2>
              <span className="text-[11px] text-white/40 font-mono">
                Official Live Android Client (3.77 MB)
              </span>
            </div>
          </div>

          <p className="text-xs text-white/60 leading-relaxed font-light">
            Download the official production client directly to your phone. It uses only your smartphone's built-in motion sensors.
          </p>

          <a
            href="/downloads/Gait_Auth_Live.apk"
            download="Gait_Auth_Live.apk"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download GaitAuth APK</span>
          </a>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/40 leading-relaxed font-light">
            <span className="text-amber-300 font-medium block mb-0.5">Android Installation Note:</span>
            If Android prompts <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>. When downloaded, tap <strong>Open</strong> &rarr; <strong>Install</strong>.
          </div>
        </div>

        {/* =========================================================
            STEP 2: COPY PASSKEY
            ========================================================= */}
        <div className="p-6 rounded-3xl bg-[#111118] border border-white/10 shadow-xl space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A477FF]/15 border border-[#A477FF]/30 flex items-center justify-center text-[#A477FF] shrink-0 font-bold font-mono text-sm">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Copy Your Facility Passkey
              </h2>
              <span className="text-[11px] text-white/40 font-mono">
                Seals your device identity to {companyName}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/60 leading-relaxed font-light">
            Your phone only needs this passkey once. Tap the button below to copy it, then open the installed app.
          </p>

          {/* Passkey Display Box */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                Sealed Passkey String
              </span>
              <span className="text-[10px] font-mono text-[#A477FF]">1-Tap Copy</span>
            </div>

            <div className="text-base sm:text-lg font-mono font-bold text-white tracking-wider text-center py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 select-all">
              {passkeyString}
            </div>

            <button
              type="button"
              onClick={handleCopyPasskey}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                copiedPasskey
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-[#A477FF] hover:bg-[#B18BFF] text-[#100A1C] shadow-lg shadow-purple-500/20'
              }`}
            >
              {copiedPasskey ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Passkey Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Passkey to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================
            STEP 3: 3-STEP WALKTHROUGH
            ========================================================= */}
        <div className="p-6 rounded-3xl bg-[#111118] border border-white/10 shadow-xl space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80 font-mono">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>How to finish setup</span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02]">
              <span className="w-5 h-5 rounded-full bg-white/10 text-white/80 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                A
              </span>
              <p className="text-white/70 leading-relaxed font-light">
                Open the installed <strong>GaitAuth</strong> app on your Android smartphone.
              </p>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02]">
              <span className="w-5 h-5 rounded-full bg-white/10 text-white/80 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                B
              </span>
              <p className="text-white/70 leading-relaxed font-light">
                Tap <strong>"Paste Passkey"</strong> (or paste from clipboard) and tap <strong>Save</strong>. The app stores it permanently.
              </p>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02]">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                ✓
              </span>
              <p className="text-white/70 leading-relaxed font-light">
                <strong>You're ready!</strong> Put your phone in your pocket and walk normally through facility doors.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Shield Assurance Banner */}
        <div className="p-4 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 flex items-center gap-3 text-left">
          <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
          <div className="text-[11px] leading-relaxed text-indigo-200/80 font-light">
            <strong className="text-white block font-medium">100% Privacy Compliant</strong>
            GaitAuth uses only standard motion sensors (accelerometer &amp; gyro). Zero camera access, zero microphone, zero continuous GPS tracking.
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="border border-white/5 rounded-2xl bg-[#111118]/60 overflow-hidden text-left">
          <button
            type="button"
            onClick={() => setIsFaqOpen(!isFaqOpen)}
            className="w-full p-4 flex items-center justify-between text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-white/40" />
              <span>Need help or having issues installing?</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFaqOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFaqOpen && (
            <div className="p-4 pt-1 border-t border-white/5 space-y-3 text-xs text-white/60 font-light leading-relaxed">
              <p>
                <strong>Why does Android warn about unknown apps?</strong><br />
                GaitAuth is an enterprise internal security application distributed directly by your organization, not the public Play Store. It is safe and verified.
              </p>
              <p>
                <strong>Lost your passkey?</strong><br />
                You can reopen this exact link anytime from your work email, or ask your company administrator to resend your invite from their Command Hub.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-[11px] text-white/30 font-mono">
          <span>&copy; 2026 GaitAuth Biometric Systems • Enterprise Perimeter</span>
        </div>

      </div>
    </div>
  );
};

export default MobileSetup;
