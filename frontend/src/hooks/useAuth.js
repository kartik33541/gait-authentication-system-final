import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to interface with authentication state, tenant data, and session utilities.
 */
export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    tenantId: store.tenantId,
    organization: store.organization,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    signup: store.signup,
    loginWithGoogle: store.loginWithGoogle,
    loginWithGithub: store.loginWithGithub,
    resetPassword: store.resetPassword,
    logout: store.logout,
    initAuthListener: store.initAuthListener,
  };
}

export default useAuth;
