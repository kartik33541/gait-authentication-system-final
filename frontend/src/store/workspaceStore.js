import { create } from 'zustand';
import { generateDeviceId } from '../lib/utils';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [
    {
      id: 'WS_ALPHA_001',
      name: 'HQ Primary Security Perimeter',
      orgKey: 'GAIT-ORG-8921-X3A2-PROD',
      serverState: 'LIVE',
      enrolledCount: 4,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      personnel: [
        { id: 'P_101', name: 'Kartik Rawat', status: 'Active Vault', readings: 5, accuracy: '99.8%' },
        { id: 'P_102', name: 'Praveen Kumar Patel', status: 'Active Vault', readings: 5, accuracy: '99.5%' },
        { id: 'P_103', name: 'Nikhil Dangi', status: 'Active Vault', readings: 5, accuracy: '99.4%' },
        { id: 'P_104', name: 'Abhishek Gupta', status: 'Active Vault', readings: 5, accuracy: '99.6%' },
      ],
      modelHash: 'LSTM_256D_84F9A1B2',
      trainingResults: [
        { epoch: 5, loss: 0.78, auc: 0.71 },
        { epoch: 15, loss: 0.42, auc: 0.88 },
        { epoch: 30, loss: 0.15, auc: 0.95 },
        { epoch: 50, loss: 0.02, auc: 0.997 }
      ],
    }
  ],
  activeWorkspaceId: 'WS_ALPHA_001',

  // Wizard Creation State
  wizardStep: 0, // 0: Kenny intro, 1: Person Count, 2: Data Capture, 3: Review & Train, 4: APK Deploy
  wizardPersonCount: 3,
  wizardPeople: [
    { id: 'W_01', name: 'Dr. Evelyn Reed', readings: ['idle', 'idle', 'idle', 'idle', 'idle'], key: generateDeviceId() },
    { id: 'W_02', name: 'Marcus Vance', readings: ['idle', 'idle', 'idle', 'idle', 'idle'], key: generateDeviceId() },
    { id: 'W_03', name: 'Sarah Jenkins', readings: ['idle', 'idle', 'idle', 'idle', 'idle'], key: generateDeviceId() },
  ],
  wizardIsTraining: false,
  wizardTrainingProgress: 0,
  wizardModelReady: false,

  setWizardStep: (step) => set({ wizardStep: step }),

  setWizardPersonCount: (count) => {
    const currentPeople = get().wizardPeople;
    let newPeople = [...currentPeople];
    if (count > currentPeople.length) {
      for (let i = currentPeople.length; i < count; i++) {
        newPeople.push({
          id: `W_${Date.now()}_${i}`,
          name: `Participant #${i + 1}`,
          readings: ['idle', 'idle', 'idle', 'idle', 'idle'],
          key: generateDeviceId()
        });
      }
    } else {
      newPeople = newPeople.slice(0, count);
    }
    set({ wizardPersonCount: count, wizardPeople: newPeople });
  },

  updateWizardPersonName: (id, name) => {
    set((state) => ({
      wizardPeople: state.wizardPeople.map((p) => (p.id === id ? { ...p, name } : p))
    }));
  },

  setReadingStatus: (personId, readingIndex, status) => {
    set((state) => ({
      wizardPeople: state.wizardPeople.map((p) => {
        if (p.id !== personId) return p;
        const newReadings = [...p.readings];
        newReadings[readingIndex] = status;
        return { ...p, readings: newReadings };
      })
    }));
  },

  startTrainingJob: () => set({ wizardIsTraining: true, wizardTrainingProgress: 0 }),
  setTrainingProgress: (progress) => set({ wizardTrainingProgress: progress }),
  completeTrainingJob: () => set({ wizardIsTraining: false, wizardTrainingProgress: 100, wizardModelReady: true }),

  deployNewWorkspace: (workspaceName) => {
    const state = get();
    const newId = `WS_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newOrgKey = `GAIT-ORG-${Math.floor(1000 + Math.random() * 9000)}-PROD`;
    const personnel = state.wizardPeople.map((p) => ({
      id: p.id,
      name: p.name,
      status: 'Active Vault',
      readings: 5,
      accuracy: '99.6%',
      key: p.key
    }));

    const newWs = {
      id: newId,
      name: workspaceName || 'New Zero-Trust Perimeter',
      orgKey: newOrgKey,
      serverState: 'LIVE',
      enrolledCount: personnel.length,
      createdAt: new Date().toISOString(),
      personnel,
      modelHash: 'LSTM_256D_' + Math.random().toString(16).substring(2, 10).toUpperCase(),
    };

    set((prev) => ({
      workspaces: [newWs, ...prev.workspaces],
      activeWorkspaceId: newId,
      wizardStep: 0,
      wizardIsTraining: false,
      wizardModelReady: false,
    }));

    return newId;
  },

  toggleServerState: (workspaceId) => {
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws;
        const nextState = ws.serverState === 'LIVE' ? 'STOPPED' : 'LIVE';
        return { ...ws, serverState: nextState };
      })
    }));
  },

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get();
    return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  }
}));
