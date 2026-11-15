import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { PageShell } from '../components/layout/PageShell';
import { WizardProgress } from '../components/workspace/WizardProgress';
import { StepNameDescription } from '../components/workspace/StepNameDescription';
import { StepAddPersons } from '../components/workspace/StepAddPersons';
import { StepEnrollmentMonitor } from '../components/workspace/StepEnrollmentMonitor';
import { StepTrainingConsole } from '../components/workspace/StepTrainingConsole';
import { ChatWindow } from '../components/kenny/ChatWindow';
import { useWorkspace } from '../hooks/useWorkspace';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

/**
 * NewWorkspace Creation Wizard Page Component
 * Routes between Step 0 (Kenny Guidance), Step 1 (Profile), Step 2 (Nodes), Step 3 (Studio), and Step 4 (Training).
 */
export const NewWorkspace = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showKennyAssistant, setShowKennyAssistant] = useState(false);
  
  const { createWorkspace, addPerson, updatePerson } = useWorkspace();
  const navigate = useNavigate();

  // Wizard state repository
  const [wizardData, setWizardData] = useState({
    name: 'GaitAuth Zero-Trust Perimeter A',
    description: 'High-security kinetic validation perimeter for enterprise server suites.',
    threshold: 'Balanced',
    persons: [
      {
        id: 'node_01',
        name: 'Kartik Rawat',
        email: 'kartik.r@gaitauth.ai',
        role: 'System Architect (Root)',
        avatar: 'K',
        readings: [
          { id: 1, duration: '60s', status: 'completed' },
          { id: 2, duration: '60s', status: 'completed' },
          { id: 3, duration: '60s', status: 'completed' },
          { id: 4, duration: '60s', status: 'completed' },
          { id: 5, duration: '60s', status: 'completed' }
        ],
        enrollmentStatus: 'completed'
      },
      {
        id: 'node_02',
        name: 'Dr. Evelyn Reed',
        email: 'e.reed@gaitauth.ai',
        role: 'Lead Biometrics Director',
        avatar: 'E',
        readings: [
          { id: 1, duration: '60s', status: 'completed' },
          { id: 2, duration: '60s', status: 'completed' },
          { id: 3, duration: '60s', status: 'completed' },
          { id: 4, duration: '60s', status: 'pending' },
          { id: 5, duration: '60s', status: 'pending' }
        ],
        enrollmentStatus: 'in_progress'
      }
    ]
  });

  const handleStep1Next = (profileData) => {
    setWizardData(prev => ({ ...prev, ...profileData }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePersons = (newPersonsList) => {
    setWizardData(prev => ({ ...prev, persons: newPersonsList }));
  };

  const handleCompleteWizard = () => {
    // Save to Zustand store
    createWorkspace({
      name: wizardData.name,
      description: wizardData.description,
      threshold: wizardData.threshold,
      persons: wizardData.persons,
      serverState: 'LIVE'
    });
    toast.success("Active Perimeter deployed! Server connection initialized.");
    navigate('/active-workspace');
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[--bg-primary]">
      <PageShell>
        {/* Step 0 Option: Kenny Diagnostic Banner */}
        <div className="max-w-4xl mx-auto w-full mb-4 flex items-center justify-between bg-[--bg-elevated-2] px-4 py-2.5 rounded-[var(--radius-pill)] border border-[--border-subtle] text-xs">
          <div className="flex items-center gap-2 font-mono text-[--text-secondary]">
            <span className="w-2 h-2 rounded-full bg-[--accent-violet]" />
            <span>NEED SETUP GUIDANCE? KENNY AI CAN ASSist YOUR CONFIGURATION</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKennyAssistant(!showKennyAssistant)}
            className="!py-1 !px-3 text-[--accent-violet] font-semibold"
          >
            {showKennyAssistant ? "Close AI Studio" : "Open Kenny Studio →"}
          </Button>
        </div>

        {/* Optional Embedded Step 0 Kenny Assistant */}
        <AnimatePresence>
          {showKennyAssistant && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-4xl mx-auto w-full mb-8 border border-[--border-strong] rounded-[var(--radius-lg)] overflow-hidden bg-[--bg-elevated]/90 shadow-2xl"
            >
              <div className="p-4 bg-black/40 flex justify-between items-center border-b border-[--border-subtle]">
                <span className="font-bold text-sm text-[--text-primary]">Step 0: Interactive Configuration Assistant</span>
                <Button variant="ghost" size="sm" onClick={() => setShowKennyAssistant(false)} className="!p-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-[500px]">
                <ChatWindow isWizardStep={true} onProceedToWizard={() => setShowKennyAssistant(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Stepper Progress Bar */}
        <WizardProgress currentStep={currentStep} onStepClick={(stepNum) => setCurrentStep(stepNum)} />

        {/* Step Form Renderers */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && (
                <StepNameDescription initialData={wizardData} onNext={handleStep1Next} />
              )}

              {currentStep === 2 && (
                <StepAddPersons
                  persons={wizardData.persons}
                  onUpdatePersons={handleUpdatePersons}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => { setCurrentStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {currentStep === 3 && (
                <StepEnrollmentMonitor
                  persons={wizardData.persons}
                  onUpdatePersons={handleUpdatePersons}
                  onBack={() => setCurrentStep(2)}
                  onNext={() => { setCurrentStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {currentStep === 4 && (
                <StepTrainingConsole
                  onComplete={handleCompleteWizard}
                  onBack={() => setCurrentStep(3)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageShell>

      <Footer />
    </div>
  );
};

export default NewWorkspace;