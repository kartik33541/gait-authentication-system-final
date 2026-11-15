import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Minus, 
  Plus, 
  Shield 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * GaitAuth — Simplified Team Setup (Onboarding Step 1).
 * Built exactly to specification: focused workspace on a #09090D canvas,
 * a single main surface panel (#111118), 8px rhythm, Inter typography,
 * and purple (#A477FF) accents without distracting grids or glows.
 */
export const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenantId, organization } = useAuth();

  // Preserve value if returning from step 2, otherwise default to 2
  const initialCount = location.state?.numUsers ? parseInt(location.state.numUsers, 10) : 2;
  const [teamSize, setTeamSize] = useState(initialCount);
  const [inputVal, setInputVal] = useState(String(initialCount));
  const [inputError, setInputError] = useState('');
  const [copied, setCopied] = useState(false);
  const [existingEmployeesCount, setExistingEmployeesCount] = useState(0);

  const quickPresets = [2, 5, 10, 25];

  useEffect(() => {
    let isMounted = true;
    const fetchExistingEmployees = async () => {
      if (tenantId) {
        try {
          const empSnap = await getDocs(collection(db, 'organizations', tenantId, 'employees'));
          if (isMounted) setExistingEmployeesCount(empSnap.size);
        } catch (err) {
          console.error("Error checking existing employees:", err);
        }
      }
    };
    fetchExistingEmployees();
    return () => { isMounted = false; };
  }, [tenantId]);

  const handleCopyTenant = () => {
    if (tenantId) {
      navigator.clipboard.writeText(tenantId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const syncCount = (newCount) => {
    const validCount = Math.max(1, Math.min(200, newCount));
    setTeamSize(validCount);
    setInputVal(String(validCount));
    setInputError('');
  };

  const handleDecrement = () => {
    if (teamSize > 1) {
      syncCount(teamSize - 1);
    }
  };

  const handleIncrement = () => {
    syncCount(teamSize + 1);
  };

  const handlePresetSelect = (preset) => {
    syncCount(preset);
  };

  const handleDirectInput = (e) => {
    const raw = e.target.value;
    setInputVal(raw);

    if (raw === '') {
      setInputError('Please enter at least 1 employee.');
      return;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1 || !/^\d+$/.test(raw)) {
      setInputError('Please enter a valid whole number.');
    } else {
      setTeamSize(parsed);
      setInputError('');
    }
  };

  const handleBlur = () => {
    if (inputVal === '' || isNaN(parseInt(inputVal, 10)) || parseInt(inputVal, 10) < 1) {
      syncCount(2);
    } else {
      syncCount(parseInt(inputVal, 10));
    }
  };

  const getTimeEstimate = (count) => {
    if (count <= 2) return 'under 2 minutes';
    if (count <= 5) return '3–5 minutes';
    if (count <= 10) return '5–8 minutes';
    return '~10 minutes';
  };

  const handleContinue = () => {
    const finalCount = Math.max(1, teamSize);
    navigate('/onboarding/data', {
      state: {
        numUsers: finalCount,
        existingCount: existingEmployeesCount
      }
    });
  };

  const companyName = organization || user?.organization || 'Ram Chandra and Sons';

  return (
    <div className="min-h-[calc(100vh-5rem)] w-full bg-[#09090D] text-[#F5F5FA] font-sans antialiased px-5 sm:px-8 lg:px-10 pt-14 md:pt-16 pb-16">
      
      {/* Centered Main Canvas Container (~1260px max width to push sidebar 5-10% to the left) */}
      <div className="w-full max-w-[1260px] mx-auto flex flex-col justify-between min-h-[calc(100vh-12rem)]">
        
        {/* Responsive Layout: 2-Column Desktop (280px Sidebar, 64px gap, ~680px Main Panel) */}
        <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-16 xl:gap-20 items-start">
          
          {/* =========================================================
              SIDEBAR (Enhanced size, 280px wide, pushed to the left)
              ========================================================= */}
          <aside className="w-full lg:w-[280px] shrink-0 flex flex-col">
            
            {/* Section Eyebrow */}
            <span className="text-[13px] leading-[18px] font-bold tracking-[0.12em] uppercase text-[#A8A8B8] select-none">
              Team setup
            </span>

            {/* Organisation Name */}
            <h2 className="text-[22px] leading-[30px] font-semibold text-[#F5F5FA] mt-2 tracking-tight">
              {companyName}
            </h2>

            {/* Company ID with Copy Button */}
            {tenantId && (
              <div className="flex items-center gap-2.5 mt-2.5">
                <span className="text-[14px] leading-[22px] text-[#A8A8B8] font-mono">
                  {tenantId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTenant}
                  className="inline-flex items-center gap-1.5 text-[13.5px] text-[#A8A8B8] hover:text-[#F5F5FA] transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-white/5"
                  title="Copy Company ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#A477FF]" />
                      <span className="text-[#A477FF] font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Vertical Progress Stepper (Desktop) / Horizontal (Mobile) */}
            <nav aria-label="Setup Progress" className="mt-9 lg:mt-11">
              
              {/* Desktop Vertical Stepper */}
              <div className="hidden lg:flex flex-col">
                
                {/* Step 1: Active */}
                <div className="flex items-start gap-3.5 relative pb-9">
                  {/* Connecting Line to Step 2 */}
                  <div className="absolute left-[10px] top-[22px] bottom-0 w-[2px] bg-[#2C2C39]" aria-hidden="true" />
                  
                  {/* Step Dot */}
                  <div className="w-[22px] h-[22px] rounded-full bg-[#A477FF] flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-[0_0_12px_rgba(164,119,255,0.35)]">
                    <span className="w-2 h-2 rounded-full bg-[#100A1C]" />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[16px] leading-[22px] font-semibold text-[#F5F5FA]" aria-current="step">
                      1 Team size
                    </span>
                  </div>
                </div>

                {/* Step 2: Next */}
                <div className="flex items-start gap-3.5 relative pb-9">
                  {/* Connecting Line to Step 3 */}
                  <div className="absolute left-[10px] top-[22px] bottom-0 w-[2px] bg-[#2C2C39]" aria-hidden="true" />
                  
                  {/* Step Circle */}
                  <div className="w-[22px] h-[22px] rounded-full border-2 border-[#2C2C39] bg-[#09090D] shrink-0 mt-0.5 z-10" />
                  
                  <div className="flex flex-col">
                    <span className="text-[16px] leading-[22px] font-medium text-[#A8A8B8]">
                      2 Walking recordings
                    </span>
                    <span className="text-[14px] leading-[20px] text-[#A8A8B8]/70 mt-0.5">
                      Two recordings per person
                    </span>
                  </div>
                </div>

                {/* Step 3: Future */}
                <div className="flex items-start gap-3.5">
                  <div className="w-[22px] h-[22px] rounded-full border-2 border-[#2C2C39] bg-[#09090D] shrink-0 mt-0.5 z-10" />
                  
                  <div className="flex flex-col">
                    <span className="text-[16px] leading-[22px] font-medium text-[#A8A8B8]">
                      3 Review & finish
                    </span>
                    <span className="text-[14px] leading-[20px] text-[#A8A8B8]/70 mt-0.5">
                      Access your dashboard
                    </span>
                  </div>
                </div>

              </div>

              {/* Mobile / Tablet Horizontal Stepper (< 900px) */}
              <div className="flex lg:hidden items-center gap-3.5 py-2.5 text-[14px]">
                <span className="font-semibold text-[#A477FF]">1. Team size</span>
                <span className="text-[#2C2C39]">→</span>
                <span className="text-[#A8A8B8]">2. Recordings</span>
                <span className="text-[#2C2C39]">→</span>
                <span className="text-[#A8A8B8]">3. Review</span>
              </div>

            </nav>

          </aside>

          {/* =========================================================
              MAIN PANEL: Single Surface (#111118, 40px padding, 20px radius)
              ========================================================= */}
          <main className="w-full flex-1 max-w-[680px] bg-[#111118] border border-[#2C2C39] rounded-[20px] p-6 sm:p-10">
            
            {/* Eyebrow */}
            <span className="text-[12px] leading-[16px] font-semibold tracking-wider uppercase text-[#A477FF]">
              STEP 1 OF 3
            </span>

            {/* Main Heading */}
            <h1 className="text-[26px] sm:text-[32px] sm:leading-[40px] font-semibold text-[#F5F5FA] tracking-tight mt-3">
              How many people are you adding?
            </h1>

            {/* Description */}
            <p className="text-[15px] leading-[23px] text-[#A8A8B8] mt-3 mb-8">
              Choose your initial team size. You can add more employees later.
            </p>

            {/* Field Label */}
            <label htmlFor="team-size-input" className="block text-[13px] font-medium text-[#A8A8B8] mb-2.5">
              Team members
            </label>

            {/* Compact Left-Aligned Number Stepper */}
            <div className="flex items-center gap-3">
              {/* Minus Button (At least 44x44px) */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={teamSize <= 1}
                aria-label="Decrease team size"
                className="w-11 h-11 rounded-[10px] bg-[#191922] hover:bg-[#232330] border border-[#2C2C39] text-[#F5F5FA] flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A477FF]"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Number Input / Display */}
              <input
                id="team-size-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputVal}
                onChange={handleDirectInput}
                onBlur={handleBlur}
                aria-label="Team member count"
                className="w-20 h-11 text-center text-[32px] sm:text-[36px] font-semibold text-[#F5F5FA] bg-transparent border-none outline-none focus:ring-0 p-0 m-0 select-all"
              />

              {/* Plus Button (At least 44x44px) */}
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase team size"
                className="w-11 h-11 rounded-[10px] bg-[#191922] hover:bg-[#232330] border border-[#2C2C39] text-[#F5F5FA] flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A477FF]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Inline validation message */}
            {inputError && (
              <p className="text-[13px] text-[#FF9B9B] mt-2">
                {inputError}
              </p>
            )}

            {/* Quick Selections */}
            <div className="mt-8">
              <span className="block text-[13px] font-medium text-[#A8A8B8] mb-2.5">
                Quick select
              </span>

              {/* 4 Compact Buttons in 1 Row */}
              <div className="grid grid-cols-4 gap-2.5 max-w-[340px]">
                {quickPresets.map((preset) => {
                  const isSelected = teamSize === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`h-11 min-w-[56px] rounded-[10px] border text-[15px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A477FF] ${
                        isSelected
                          ? 'bg-[#262035] border-[#A477FF] text-[#F5F5FA]'
                          : 'bg-[#191922] border-[#2C2C39] hover:border-white/20 text-[#F5F5FA]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#A477FF]" aria-hidden="true" />}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thin Divider separating Summary */}
            <div className="w-full border-t border-[#2C2C39] my-8" />

            {/* Summary Block */}
            <div className="space-y-1">
              <div className="text-[15px] font-medium text-[#F5F5FA]">
                {teamSize} {teamSize === 1 ? 'employee' : 'employees'} · {teamSize * 2} recordings
              </div>
              <div className="text-[13px] leading-[20px] text-[#A8A8B8]">
                Estimated time: {getTimeEstimate(teamSize)}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-12 rounded-[10px] bg-[#A477FF] hover:bg-[#B18BFF] active:bg-[#9764FF] text-[#100A1C] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#A477FF]"
              >
                <span>Continue to add team members</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <p className="text-[13px] leading-[20px] text-[#A8A8B8] text-center mt-3">
                Next: enter employee names and upload walking recordings.
              </p>
            </div>

          </main>

        </div>

        {/* =========================================================
            SECURITY NOTE (Outside main panel as a quiet footer note)
            ========================================================= */}
        <footer className="mt-14 pt-6 border-t border-[#2C2C39]/40 flex items-start sm:items-center gap-3 text-[13px] leading-[20px] text-[#A8A8B8]">
          <Shield className="w-4 h-4 text-[#A477FF] shrink-0 mt-0.5 sm:mt-0" />
          <p>
            Each person provides two short smartphone motion recordings. GaitAuth uses their walking rhythm to create a secure, hands-free passkey.
          </p>
        </footer>

      </div>

    </div>
  );
};

export default Onboarding;
