import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * Custom hook to access and control Gait Authentication workspaces and creation wizard state.
 */
export function useWorkspace() {
  const store = useWorkspaceStore();
  return {
    workspaces: store.workspaces,
    activeWorkspaceId: store.activeWorkspaceId,
    activeWorkspace: store.getActiveWorkspace(),
    wizardStep: store.wizardStep,
    wizardPersonCount: store.wizardPersonCount,
    wizardPeople: store.wizardPeople,
    wizardIsTraining: store.wizardIsTraining,
    wizardTrainingProgress: store.wizardTrainingProgress,
    wizardModelReady: store.wizardModelReady,
    setWizardStep: store.setWizardStep,
    setWizardPersonCount: store.setWizardPersonCount,
    updateWizardPersonName: store.updateWizardPersonName,
    setReadingStatus: store.setReadingStatus,
    startTrainingJob: store.startTrainingJob,
    setTrainingProgress: store.setTrainingProgress,
    completeTrainingJob: store.completeTrainingJob,
    deployNewWorkspace: store.deployNewWorkspace,
    toggleServerState: store.toggleServerState,
  };
}

export default useWorkspace;
