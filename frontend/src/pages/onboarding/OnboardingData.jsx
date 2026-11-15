import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  CheckCircle2,
  X, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Shield, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * GaitAuth — Step 2: Employee Details & Recordings (Onboarding Data).
 * Engineered as a focused, calm enterprise workspace matching exact design specifications:
 * - Canvas #09090D, single elevated workspace #111118, border #2C2C39.
 * - Restrained typography (Inter), purple #A477FF accent, and mint #7EDDB5 for verified states.
 * - Prominent full-width drag-and-drop CSV upload dropzone per employee.
 * - Technical details (256-D template extraction) safely nested in an accessible disclosure.
 */
export const OnboardingData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tenantId, organization } = useAuth();

  const rawNumUsers = location.state?.numUsers ? parseInt(location.state.numUsers, 10) : 0;
  const numUsers = Math.max(0, rawNumUsers);
  const existingCount = location.state?.existingCount || 0;

  // Format default Employee ID (e.g., EMP-001)
  const formatTemplateId = (index) => `EMP-${String(existingCount + index + 1).padStart(3, '0')}`;

  // State for all employee entries (hooks declared unconditionally above redirect)
  const [usersData, setUsersData] = useState(() =>
    Array.from({ length: numUsers || 1 }).map((_, i) => ({
      id: i,
      template_id: formatTemplateId(i),
      name: '',
      email: '',
      files: [], // Array of { name, size, content }
      fileError: ''
    }))
  );

  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);

  // If accessed directly without setting a team size, return to Step 1
  if (!numUsers || numUsers <= 0) {
    return <Navigate to="/onboarding" replace />;
  }

  const companyName = organization || user?.organization || 'Ram Chandra and Sons';

  const handleCopyTenant = () => {
    if (tenantId) {
      navigator.clipboard.writeText(tenantId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNameChange = (id, newName) => {
    setUsersData(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
  };

  const handleEmailChange = (id, newEmail) => {
    setUsersData(prev => prev.map(u => u.id === id ? { ...u, email: newEmail } : u));
  };

  const handleTemplateIdChange = (id, newTemplateId) => {
    setUsersData(prev => prev.map(u => u.id === id ? { ...u, template_id: newTemplateId.toUpperCase().trim() } : u));
  };

  // Helper to format bytes to readable KB
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  // Process incoming files (from input change or drag-and-drop)
  const processFiles = (id, fileList) => {
    if (!fileList || fileList.length === 0) return;
    const incomingFiles = Array.from(fileList);

    // Validate file extensions
    const invalidFiles = incomingFiles.filter(f => !f.name.toLowerCase().endsWith('.csv'));
    if (invalidFiles.length > 0) {
      setUsersData(prev => prev.map(u => 
        u.id === id ? { ...u, fileError: 'Only .csv recordings are supported.' } : u
      ));
      return;
    }

    // Read files via FileReader
    Promise.all(
      incomingFiles.map(f => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: f.name,
          size: f.size,
          content: e.target.result
        });
        reader.readAsText(f);
      }))
    ).then(newReadFiles => {
      const requiredCols = ['ax', 'ay', 'az', 'wx', 'wy', 'wz'];
      for (const rf of newReadFiles) {
        const text = String(rf.content || '').trim();
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) {
          setUsersData(prev => prev.map(u =>
            u.id === id ? { ...u, fileError: `"${rf.name}" is empty or contains no motion data rows.` } : u
          ));
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const missing = requiredCols.filter(col => !headers.includes(col));
        if (missing.length > 0) {
          setUsersData(prev => prev.map(u =>
            u.id === id ? { ...u, fileError: `"${rf.name}" is missing required sensor columns: ${missing.join(', ')}.` } : u
          ));
          return;
        }
      }

      setUsersData(prev => prev.map(u => {
        if (u.id !== id) return u;
        // Avoid duplicate files by name
        const existingNames = new Set(u.files.map(f => f.name));
        const filteredNew = newReadFiles.filter(f => !existingNames.has(f.name));
        return {
          ...u,
          files: [...u.files, ...filteredNew],
          fileError: ''
        };
      }));
    });
  };

  const handleRemoveFile = (userId, fileIndex) => {
    setUsersData(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updated = u.files.filter((_, idx) => idx !== fileIndex);
      return { ...u, files: updated };
    }));
  };

  // Drag and Drop handlers
  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(id);
  };

  const handleDragLeave = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverId === id) setDragOverId(null);
  };

  const handleDrop = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    if (e.dataTransfer?.files) {
      processFiles(id, e.dataTransfer.files);
    }
  };

  // Employee readiness validation
  const checkEmployeeStatus = (u) => {
    if (u.fileError) {
      return { status: 'attention', label: 'Needs attention', color: 'text-[#FF9B9B] bg-[#FF9B9B]/10 border-[#FF9B9B]/20' };
    }
    const hasName = u.name.trim().length > 0;
    const hasId = u.template_id.trim().length > 0;
    const hasRecordings = u.files.length >= 2;

    if (hasName && hasId && hasRecordings) {
      return { status: 'ready', label: 'Ready', color: 'text-[#7EDDB5] bg-[#7EDDB5]/10 border-[#7EDDB5]/20' };
    }
    if (!hasName) {
      return { status: 'needs-details', label: 'Needs details', color: 'text-[#A8A8B8] bg-white/5 border-[#2C2C39]' };
    }
    return { status: 'needs-recordings', label: 'Needs recordings', color: 'text-[#E2B340] bg-[#E2B340]/10 border-[#E2B340]/20' };
  };

  const readyEmployeesCount = usersData.filter(u => checkEmployeeStatus(u).status === 'ready').length;
  const isAllReady = readyEmployeesCount === numUsers;

  // Determine guidance message for primary button
  const getGuidanceMessage = () => {
    if (isAllReady) return 'All employees configured. Ready to extract biometric templates.';
    for (let i = 0; i < usersData.length; i++) {
      const u = usersData[i];
      const displayName = u.name.trim() || `Employee ${i + 1}`;
      if (!u.name.trim()) return `Please provide a name for ${displayName}.`;
      if (!u.template_id.trim()) return `Please assign an Employee ID for ${displayName}.`;
      if (u.files.length === 0) return `${displayName} needs at least 2 walking recordings.`;
      if (u.files.length === 1) return `${displayName} needs 1 more walking recording.`;
    }
    return 'Complete all employees to continue.';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllReady || isSubmitting) return;

    // Check duplicate employee IDs
    const templateIds = usersData.map(u => u.template_id.trim());
    if (new Set(templateIds).size !== templateIds.length) {
      toast.error('Each employee must have a unique Employee ID.');
      return;
    }

    // Optional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const u of usersData) {
      if (u.email && u.email.trim() && !emailRegex.test(u.email.trim())) {
        toast.error(`Please provide a valid email format for ${u.name || u.template_id}.`);
        return;
      }
    }

    setIsSubmitting(true);

    // Format clean payload for step 3
    const formattedPayload = usersData.map(u => ({
      id: u.id,
      name: u.name.trim(),
      email: (u.email || '').trim().toLowerCase(),
      template_id: u.template_id.trim(),
      files: u.files.map(f => f.name),
      fileContents: u.files.map(f => f.content)
    }));

    navigate('/onboarding/processing', { state: { usersData: formattedPayload } });
  };

  const handleBack = () => {
    navigate('/onboarding', { state: { numUsers, existingCount } });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] w-full bg-[#09090D] text-[#F5F5FA] font-sans antialiased px-5 sm:px-8 lg:px-12 pt-12 md:pt-14 pb-20">
      
      {/* Centered Main Canvas Container (~1360px max width for an authoritative layout) */}
      <div className="w-full max-w-[1360px] mx-auto flex flex-col justify-between">
        
        {/* 2-Column Desktop Layout (320px Sidebar, 80px gap, ~860px Main Workspace) */}
        <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-16 xl:gap-24 items-start">
          
          {/* =========================================================
              SIDEBAR (Solid & Prominent, 320px wide, pushed to the left)
              ========================================================= */}
          <aside className="w-full lg:w-[320px] shrink-0 flex flex-col">
            
            {/* Section Eyebrow */}
            <span className="text-[13px] leading-[18px] font-bold tracking-[0.14em] uppercase text-[#A8A8B8] select-none">
              Team setup
            </span>

            {/* Organisation Name */}
            <h2 className="text-[26px] sm:text-[28px] leading-[34px] font-bold text-[#F5F5FA] mt-2.5 tracking-tight">
              {companyName}
            </h2>

            {/* Company ID with Copy Button */}
            {tenantId && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[15px] leading-[22px] text-[#A8A8B8] font-mono">
                  {tenantId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTenant}
                  className="inline-flex items-center gap-1.5 text-[14px] text-[#A8A8B8] hover:text-[#F5F5FA] transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10"
                  title="Copy Company ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#7EDDB5]" />
                      <span className="text-[#7EDDB5] font-medium">Copied</span>
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

            {/* Progress Indicator Rail */}
            <nav aria-label="Setup Progress" className="mt-11 lg:mt-14">
              
              {/* Desktop Vertical Stepper */}
              <div className="hidden lg:flex flex-col">
                
                {/* Step 1: Completed */}
                <div className="flex items-start gap-4 relative pb-10">
                  <div className="absolute left-[13px] top-[26px] bottom-0 w-[2px] bg-[#2C2C39]" aria-hidden="true" />
                  <div className="w-7 h-7 rounded-full bg-[#7EDDB5] flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-[0_0_14px_rgba(126,221,181,0.3)]">
                    <Check className="w-4 h-4 text-[#09090D] stroke-[3]" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[17px] leading-[24px] font-semibold text-[#F5F5FA]">
                      1 Team size
                    </span>
                    <span className="text-[14.5px] leading-[22px] text-[#A8A8B8] mt-1">
                      {numUsers} {numUsers === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                </div>

                {/* Step 2: Active */}
                <div className="flex items-start gap-4 relative pb-10">
                  <div className="absolute left-[13px] top-[26px] bottom-0 w-[2px] bg-[#2C2C39]" aria-hidden="true" />
                  <div className="w-7 h-7 rounded-full bg-[#A477FF] flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-[0_0_16px_rgba(164,119,255,0.4)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#100A1C]" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[17px] leading-[24px] font-semibold text-[#F5F5FA]" aria-current="step">
                      2 Walking recordings
                    </span>
                    <span className="text-[14.5px] leading-[22px] text-[#A477FF] mt-1 font-medium">
                      In progress
                    </span>
                  </div>
                </div>

                {/* Step 3: Upcoming */}
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full border-2 border-[#2C2C39] bg-[#09090D] shrink-0 mt-0.5 z-10" />
                  <div className="flex flex-col pt-0.5">
                    <span className="text-[17px] leading-[24px] font-medium text-[#A8A8B8]">
                      3 Review & finish
                    </span>
                    <span className="text-[14.5px] leading-[22px] text-[#A8A8B8]/70 mt-1">
                      Access your dashboard
                    </span>
                  </div>
                </div>

              </div>

              {/* Mobile / Tablet Horizontal Stepper */}
              <div className="flex lg:hidden items-center gap-4 py-3 text-[14px]">
                <span className="text-[#7EDDB5] font-semibold">✓ 1. Size ({numUsers})</span>
                <span className="text-[#2C2C39]">→</span>
                <span className="font-semibold text-[#A477FF]">2. Recordings</span>
                <span className="text-[#2C2C39]">→</span>
                <span className="text-[#A8A8B8]">3. Finish</span>
              </div>

            </nav>

          </aside>

          {/* =========================================================
              MAIN COLUMN: Heading, Workspace Surface & Form
              ========================================================= */}
          <main className="w-full flex-1 max-w-[800px] flex flex-col">
            
            {/* Step Eyebrow */}
            <span className="text-[12px] leading-[16px] font-semibold tracking-wider uppercase text-[#A477FF]">
              STEP 2 OF 3
            </span>

            {/* Main Heading */}
            <h1 className="text-[28px] sm:text-[32px] sm:leading-[40px] font-semibold text-[#F5F5FA] tracking-tight mt-2.5">
              Add your team’s walking recordings
            </h1>

            {/* Description */}
            <p className="text-[15px] leading-[23px] text-[#A8A8B8] mt-2 mb-4">
              Enter each employee’s details and upload at least two CSV recordings per person.
            </p>

            {/* Recording Requirements Collapsible Disclosure */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setIsRequirementsOpen(prev => !prev)}
                className="inline-flex items-center gap-1.5 text-[13px] text-[#A8A8B8] hover:text-[#F5F5FA] transition-colors cursor-pointer py-1 select-none"
              >
                <span>Recording requirements</span>
                {isRequirementsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isRequirementsOpen && (
                <div className="mt-2.5 p-4 rounded-xl bg-[#111118] border border-[#2C2C39] text-[13px] leading-[20px] text-[#A8A8B8] space-y-2">
                  <p>
                    <strong className="text-[#F5F5FA] font-medium">Format:</strong> Standard smartphone motion recordings exported in <code className="px-1.5 py-0.5 rounded bg-[#181820] text-[#F5F5FA] border border-[#2C2C39]">.csv</code> format containing tri-axial accelerometer / gyroscope data.
                  </p>
                  <p>
                    <strong className="text-[#F5F5FA] font-medium">Quantity:</strong> At least 2 separate recordings per employee for accurate stride pattern matching.
                  </p>
                  <p className="text-[12px] text-[#A8A8B8]/80 pt-1 border-t border-[#2C2C39]/60">
                    GaitAuth uses these recordings to extract each employee’s 256-dimensional biometric template.
                  </p>
                </div>
              )}
            </div>

            {/* Form wrapping the single workspace surface */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col">
              
              {/* =========================================================
                  SINGLE MAIN WORKSPACE SURFACE (#111118, border #2C2C39)
                  ========================================================= */}
              <div className="w-full bg-[#111118] border border-[#2C2C39] rounded-[20px] p-6 sm:p-8 relative overflow-hidden">
                
                {/* Workspace Header: Title + Ready Counter */}
                <div className="flex items-center justify-between pb-4 border-b border-[#2C2C39]">
                  <span className="text-[15px] font-semibold text-[#F5F5FA]">
                    Team members
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-medium ${isAllReady ? 'text-[#7EDDB5]' : 'text-[#A8A8B8]'}`}>
                      {readyEmployeesCount} of {numUsers} ready
                    </span>
                    {isAllReady && (
                      <CheckCircle2 className="w-4 h-4 text-[#7EDDB5]" />
                    )}
                  </div>
                </div>

                {/* Readiness Progress Bar (2px) */}
                <div className="w-full h-[2px] bg-[#191922] -mt-[1px]">
                  <div 
                    className="h-full bg-[#7EDDB5] transition-all duration-300 ease-out"
                    style={{ width: `${(readyEmployeesCount / numUsers) * 100}%` }}
                  />
                </div>

                {/* List of Employee Sections separated by thin dividers */}
                <div className="divide-y divide-[#2C2C39]">
                  {usersData.map((emp, index) => {
                    const empStatus = checkEmployeeStatus(emp);
                    const isDragOver = dragOverId === emp.id;

                    return (
                      <div key={emp.id} className="pt-7 pb-8 first:pt-6 last:pb-2">
                        
                        {/* Section Header: Number + Name + Status Label */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-mono font-semibold text-[#A8A8B8] px-2 py-0.5 rounded bg-[#181820] border border-[#2C2C39]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="text-[16px] font-semibold text-[#F5F5FA] tracking-tight">
                              {emp.name.trim() || `Employee ${index + 1}`}
                            </h3>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[12px] font-medium px-2.5 py-1 rounded-[6px] border flex items-center gap-1.5 ${empStatus.color}`}>
                            {empStatus.status === 'ready' && <Check className="w-3 h-3 stroke-[3]" />}
                            {empStatus.status === 'attention' && <AlertCircle className="w-3 h-3" />}
                            <span>{empStatus.label}</span>
                          </span>
                        </div>

                        {/* Identity Fields: Name, Email & Badge ID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                          
                          {/* Employee Name */}
                          <div>
                            <label 
                              htmlFor={`emp-name-${emp.id}`}
                              className="block text-[13px] font-medium text-[#A8A8B8] mb-2"
                            >
                              Employee name
                            </label>
                            <input
                              id={`emp-name-${emp.id}`}
                              type="text"
                              value={emp.name}
                              onChange={(e) => handleNameChange(emp.id, e.target.value)}
                              placeholder="Full name (e.g. Jensen Doe)"
                              className="w-full h-11 px-3.5 rounded-[10px] bg-[#181820] border border-[#2C2C39] text-[#F5F5FA] text-[14px] placeholder-[#A8A8B8]/40 transition-colors focus:border-[#A477FF] focus:outline-none focus:ring-1 focus:ring-[#A477FF]"
                              required
                            />
                          </div>

                          {/* Work Email (Issue 9 Mobile Invite) */}
                          <div>
                            <label 
                              htmlFor={`emp-email-${emp.id}`}
                              className="block text-[13px] font-medium text-[#A8A8B8] mb-2"
                            >
                              Work email
                            </label>
                            <input
                              id={`emp-email-${emp.id}`}
                              type="email"
                              value={emp.email || ''}
                              onChange={(e) => handleEmailChange(emp.id, e.target.value)}
                              placeholder="jensen@company.com"
                              className="w-full h-11 px-3.5 rounded-[10px] bg-[#181820] border border-[#2C2C39] text-[#F5F5FA] text-[14px] placeholder-[#A8A8B8]/40 transition-colors focus:border-[#A477FF] focus:outline-none focus:ring-1 focus:ring-[#A477FF]"
                            />
                            <p className="text-[11px] leading-[16px] text-[#A8A8B8]/70 mt-1.5">
                              Receives 1-click mobile passkey invite.
                            </p>
                          </div>

                          {/* Employee ID */}
                          <div>
                            <label 
                              htmlFor={`emp-id-${emp.id}`}
                              className="block text-[13px] font-medium text-[#A8A8B8] mb-2"
                            >
                              Badge ID
                            </label>
                            <input
                              id={`emp-id-${emp.id}`}
                              type="text"
                              value={emp.template_id}
                              onChange={(e) => handleTemplateIdChange(emp.id, e.target.value)}
                              placeholder="EMP-001"
                              className="w-full h-11 px-3.5 rounded-[10px] bg-[#181820] border border-[#2C2C39] text-[#F5F5FA] text-[14px] font-mono placeholder-[#A8A8B8]/40 transition-colors focus:border-[#A477FF] focus:outline-none focus:ring-1 focus:ring-[#A477FF]"
                              required
                            />
                            <p className="text-[11px] leading-[16px] text-[#A8A8B8]/70 mt-1.5">
                              Unique facility identity code.
                            </p>
                          </div>

                        </div>

                        {/* Full-Width Recording Upload Dropzone (Key Layout Improvement) */}
                        <div>
                          <label className="block text-[13px] font-medium text-[#A8A8B8] mb-2">
                            Walking recordings
                          </label>

                          <div
                            onDragOver={(e) => handleDragOver(e, emp.id)}
                            onDragLeave={(e) => handleDragLeave(e, emp.id)}
                            onDrop={(e) => handleDrop(e, emp.id)}
                            className={`relative min-h-[120px] rounded-xl border border-dashed transition-all p-5 flex flex-col items-center justify-center text-center cursor-pointer ${
                              isDragOver 
                                ? 'border-[#A477FF] bg-[#262035]/50' 
                                : 'border-[#2C2C39] bg-[#181820]/60 hover:border-[#A477FF]/60 hover:bg-[#181820]'
                            }`}
                          >
                            <input
                              type="file"
                              accept=".csv"
                              multiple
                              id={`file-input-${emp.id}`}
                              onChange={(e) => processFiles(emp.id, e.target.files)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              title="Upload CSV walking recordings"
                            />

                            <div className="w-9 h-9 rounded-full bg-[#262035] flex items-center justify-center mb-2.5 pointer-events-none">
                              <Upload className="w-4 h-4 text-[#A477FF]" />
                            </div>

                            <span className="text-[14px] font-medium text-[#F5F5FA] pointer-events-none">
                              Upload walking recordings
                            </span>

                            <p className="text-[13px] text-[#A8A8B8] mt-1 pointer-events-none">
                              Drop CSV recordings here or <span className="text-[#A477FF] hover:underline font-medium">browse</span>
                            </p>

                            <p className="text-[12px] text-[#A8A8B8]/70 mt-1 pointer-events-none">
                              At least 2 recordings required
                            </p>
                          </div>

                          {/* Inline File Format Error if present */}
                          {emp.fileError && (
                            <p className="text-[12px] text-[#FF9B9B] mt-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{emp.fileError}</span>
                            </p>
                          )}

                          {/* Uploaded Recordings List (Compact Rows) */}
                          {emp.files && emp.files.length > 0 && (
                            <div className="mt-3.5 space-y-2">
                              {emp.files.map((file, fileIdx) => (
                                <div 
                                  key={fileIdx}
                                  className="h-10 px-3.5 rounded-[8px] bg-[#181820] border border-[#2C2C39] flex items-center justify-between gap-3 text-[13px]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="w-4 h-4 text-[#A477FF] shrink-0" />
                                    <span className="text-[#F5F5FA] font-medium truncate max-w-[240px] sm:max-w-[340px]" title={file.name}>
                                      {file.name}
                                    </span>
                                    <span className="text-[#A8A8B8] text-[12px] shrink-0">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#7EDDB5]">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span className="hidden sm:inline">Valid CSV</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(emp.id, fileIdx)}
                                      className="p-1 text-[#A8A8B8] hover:text-[#FF9B9B] transition-colors rounded hover:bg-white/5 cursor-pointer"
                                      title="Remove recording"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Explicit Recording Status Count */}
                              <div className="pt-1 flex items-center justify-between text-[12px]">
                                {emp.files.length < 2 ? (
                                  <span className="text-[#A8A8B8]">
                                    {emp.files.length} recording added · {2 - emp.files.length} more required
                                  </span>
                                ) : (
                                  <span className="text-[#7EDDB5] font-medium flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{emp.files.length} recordings added · Minimum met</span>
                                  </span>
                                )}

                                <label
                                  htmlFor={`file-input-${emp.id}`}
                                  className="text-[#A477FF] hover:underline cursor-pointer font-medium"
                                >
                                  + Add more recordings
                                </label>
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>

              {/* =========================================================
                  ACTION AREA: Back Button + Primary Action
                  ========================================================= */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="h-12 px-6 rounded-[10px] bg-transparent hover:bg-white/5 border border-[#2C2C39] text-[#F5F5FA] text-[14px] font-medium transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={!isAllReady || isSubmitting}
                  className="h-12 px-8 rounded-[10px] bg-[#A477FF] hover:bg-[#B18BFF] active:bg-[#9764FF] text-[#100A1C] text-[15px] font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(164,119,255,0.2)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#100A1C]" />
                      <span>Creating signatures…</span>
                    </>
                  ) : (
                    <>
                      <span>Create biometric signatures</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

              </div>

              {/* Explicit Dynamic Guidance beneath Primary Action */}
              <p className={`text-[13px] text-center sm:text-right mt-3 ${isAllReady ? 'text-[#7EDDB5]' : 'text-[#A8A8B8]'}`}>
                {getGuidanceMessage()}
              </p>

            </form>

          </main>

        </div>

        {/* Quiet Security Footer Note */}
        <footer className="mt-16 pt-6 border-t border-[#2C2C39]/40 flex items-start sm:items-center gap-3 text-[13px] leading-[20px] text-[#A8A8B8]">
          <Shield className="w-4 h-4 text-[#A477FF] shrink-0 mt-0.5 sm:mt-0" />
          <p>
            Recordings are processed securely using your private company perimeter key. Motion temporal profiles never leave your protected enclave.
          </p>
        </footer>

      </div>

    </div>
  );
};

export default OnboardingData;
