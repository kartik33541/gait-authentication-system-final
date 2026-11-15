/**
 * @file App.jsx
 * @description Root application file for the Gait Authentication Platform.
 * Features a modern, Gemini-inspired UI architecture, deep context management
 * (Theme, Auth, Biometric Data), robust error boundaries, and nested routing.
 * Collaborator architecture configured for the core team.
 */

import React, { useState, useEffect, Suspense, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { AuthGateModal } from './components/ui/AuthGateModal';
import { AuthGateScreen } from './components/ui/AuthGateScreen';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';

/* ==========================================================================
   1. CONTEXT PROVIDERS (Theme)
   ========================================================================== */

// Theme Context: Handles light/dark mode toggling globally
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('gait-theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('gait-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ==========================================================================
   2. CORE ARCHITECTURE COMPONENTS
   ========================================================================== */

/**
 * AnimatedBackground Component
 * Renders the deep CSS variables defined in index.css to create the Gemini mesh.
 */
const AnimatedBackground = () => (
  <div className="ai-canvas-bg pointer-events-none" aria-hidden="true"></div>
);

/* ==========================================================================
   3. ROUTE PROTECTION & LAYOUTS
   ========================================================================== */

/**
 * ProtectedRoute Component
 * Ensures only authenticated users can access the dashboard and workspace routes.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-bg-tertiary border-t-brand-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-mono text-text-muted tracking-widest animate-pulse">
          INITIALIZING SECURE SESSION...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGateScreen />;
  }

  return children;
};

/* ==========================================================================
   4. PLACEHOLDER PAGE COMPONENTS (For demonstration of routing)
   ========================================================================== */

// Lazy loaded for performance optimization in a real enterprise application
const Landing = React.lazy(() => import('./pages/Landing').catch(() => ({ default: () => <div className="p-20 text-center">Landing Page</div> })));
const Login = React.lazy(() => import('./pages/Login').catch(() => ({ default: () => <div className="p-20 text-center">Login Page</div> })));
const Signup = React.lazy(() => import('./pages/Signup').catch(() => ({ default: () => <div className="p-20 text-center">Signup Page</div> })));
const Auth = React.lazy(() => import('./pages/Auth').catch(() => ({ default: () => <div className="p-20 text-center">Auth Page</div> })));
const KennySpace = React.lazy(() => import('./pages/KennySpace').catch(() => ({ default: () => <div className="p-20 text-center">Kenny Chat Space</div> })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').catch(() => ({ default: () => <div className="p-20 text-center">Command Hub</div> })));
const NewWorkspace = React.lazy(() => import('./pages/NewWorkspace').catch(() => ({ default: () => <div className="p-20 text-center">New Workspace Setup</div> })));
const ActiveWorkspace = React.lazy(() => import('./pages/ActiveWorkspace').catch(() => ({ default: () => <div className="p-20 text-center">Active Auth Perimeter</div> })));
const AndroidApp = React.lazy(() => import('./pages/AndroidApp').catch(() => ({ default: () => <div className="p-20 text-center">Android App</div> })));
const MobileSetup = React.lazy(() => import('./pages/MobileSetup').catch(() => ({ default: () => <div className="p-20 text-center">Mobile Setup</div> })));
const NotFound = React.lazy(() => import('./pages/NotFound').catch(() => ({ default: () => <div className="p-20 text-center">404 - Page Not Found</div> })));

// Onboarding Pages
const Onboarding = React.lazy(() => import('./pages/onboarding/Onboarding').catch(() => ({ default: () => <div className="p-20 text-center">Onboarding Chat</div> })));
const OnboardingData = React.lazy(() => import('./pages/onboarding/OnboardingData').catch(() => ({ default: () => <div className="p-20 text-center">Onboarding Data</div> })));
const OnboardingProcessing = React.lazy(() => import('./pages/onboarding/OnboardingProcessing').catch(() => ({ default: () => <div className="p-20 text-center">Onboarding Processing</div> })));

/**
 * Global Error Boundary Fallback
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { this.setState({ errorInfo }); console.error("App Crash:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
          <div className="max-w-2xl glass-card p-12 text-center">
            <h1 className="text-4xl font-display font-bold text-red-500 mb-4">Critical System Failure</h1>
            <p className="text-text-secondary mb-8">The neural engine encountered an unexpected exception.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-secondary transition-colors">
              Reboot System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

/* ==========================================================================
   5. MAIN APPLICATION ENTRY POINT
   ========================================================================== */

/**
 * App Component
 * Wraps the entire application in context providers, error boundaries, 
 * and defines the comprehensive React Router DOM structure.
 */
const Layout = ({ children }) => {
  const location = useLocation();
  // Standalone auth and setup pages hide the admin navbar entirely
  const isNavbarHidden = ['/login', '/signup', '/auth', '/setup', '/invite'].includes(location.pathname);
  const isImmersive = isNavbarHidden || ['/', '/kenny', '/android', '/mobile'].includes(location.pathname);
  
  return (
    <>
      <AnimatedBackground />
      {!isNavbarHidden && <Navbar />}
      <AuthGateModal />
      <main className={`relative min-h-screen w-full flex flex-col ${isImmersive ? '' : 'pt-20'}`}>
        {children}
      </main>
    </>
  );
};

function App() {
  const { initAuthListener } = useAuth();

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [initAuthListener]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Layout>
            {/* Suspense wrapper handles lazy-loaded component states smoothly */}
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-3 h-3 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-3 h-3 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/android" element={<AndroidApp />} />
                <Route path="/mobile" element={<Navigate to="/android" replace />} />
                <Route path="/setup" element={<MobileSetup />} />
                <Route path="/invite" element={<Navigate to="/setup" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                
                {/* Protected AI Operations Assistant Route */}
                <Route path="/kenny" element={
                  <ProtectedRoute>
                    <KennySpace />
                  </ProtectedRoute>
                } />
                
                {/* Protected Workspace Routes (Requires Authentication) */}
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } />
                
                <Route path="/onboarding/data" element={
                  <ProtectedRoute>
                    <OnboardingData />
                  </ProtectedRoute>
                } />

                <Route path="/onboarding/processing" element={
                  <ProtectedRoute>
                    <OnboardingProcessing />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Legacy /new-workspace is deprecated and seamlessly redirects to the official onboarding pipeline */}
                <Route path="/new-workspace" element={
                  <ProtectedRoute>
                    <Navigate to="/onboarding" replace />
                  </ProtectedRoute>
                } />
                
                <Route path="/active-workspace" element={
                  <ProtectedRoute>
                    <ActiveWorkspace />
                  </ProtectedRoute>
                } />
                
                {/* 404 Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#181820',
                color: '#F5F5FA',
                border: '1px solid #2C2C39',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif'
              },
              success: {
                iconTheme: {
                  primary: '#7EDDB5',
                  secondary: '#181820',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF6B6B',
                  secondary: '#181820',
                },
              },
            }}
          />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;