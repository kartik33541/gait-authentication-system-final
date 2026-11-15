import { create } from 'zustand';

export const useUiStore = create((set) => ({
  theme: 'dark',
  isMobileNavOpen: false,
  isDuplicateModalOpen: false,
  isServerStopConfirmOpen: false,
  selectedWorkspaceForAction: null,

  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  openDuplicateModal: () => set({ isDuplicateModalOpen: true }),
  closeDuplicateModal: () => set({ isDuplicateModalOpen: false }),

  openServerStopConfirm: (workspaceId) => set({ isServerStopConfirmOpen: true, selectedWorkspaceForAction: workspaceId }),
  closeServerStopConfirm: () => set({ isServerStopConfirmOpen: false, selectedWorkspaceForAction: null }),

  authGateModal: {
    isOpen: false,
    featureName: '',
    description: '',
    redirectTo: '/dashboard',
  },

  openAuthGateModal: ({ featureName = 'this feature', description = '', redirectTo = '/dashboard' } = {}) =>
    set({
      authGateModal: {
        isOpen: true,
        featureName,
        description,
        redirectTo: redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard',
      },
    }),

  closeAuthGateModal: () =>
    set((state) => ({
      authGateModal: {
        ...state.authGateModal,
        isOpen: false,
      },
    })),
}));
