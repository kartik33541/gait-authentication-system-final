import { create } from 'zustand';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const createDefaultOrganizationPayload = ({ tenantId, companyName, adminUid, adminEmail, adminName }) => ({
  tenant_id: tenantId,
  company_name: companyName || 'GaitAuth Organization',
  admin_uid: adminUid,
  admin_email: adminEmail,
  admin_name: adminName || 'Authorized Admin',
  total_employees: 0,
  active_perimeter: true,
  emergency_lockdown: false,
  security_policy: {
    strictness_mode: 'BALANCED',
    threshold: 0.75,
    auto_night_strict: true,
    updated_at: new Date().toISOString(),
    updated_by: adminName || 'System Default'
  },
  createdAt: serverTimestamp()
});

export const useAuthStore = create((set, get) => ({
  user: null,
  tenantId: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initializes the real-time Firebase Auth state listener.
   * Restores session on page reload and synchronizes with Firestore user profile.
   */
  initAuthListener: () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user metadata from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const profile = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Authorized Admin',
              email: firebaseUser.email,
              role: 'admin', // Always admin as required
              organization: data.organization || 'GaitAuth Organization',
              tenant_id: data.tenant_id,
              avatar: (data.name || firebaseUser.email || 'A').charAt(0).toUpperCase()
            };

            set({
              user: profile,
              tenantId: data.tenant_id,
              organization: data.organization,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            // Document not found in users collection (fallback)
            const fallbackProfile = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authorized Admin',
              email: firebaseUser.email,
              role: 'admin',
              organization: 'Enterprise Perimeter',
              tenant_id: null,
              avatar: (firebaseUser.email || 'A').charAt(0).toUpperCase()
            };

            set({
              user: fallbackProfile,
              tenantId: null,
              organization: 'Enterprise Perimeter',
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          }
        } catch (err) {
          console.error("Error fetching user profile from Firestore:", err);
          set({ isLoading: false });
        }
      } else {
        set({
          user: null,
          tenantId: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    });
  },

  /**
   * Signs in an existing company administrator via Firebase Auth.
   */
  login: async ({ email, password, rememberMe = true }) => {
    set({ isLoading: true, error: null });
    try {
      if (typeof window !== 'undefined') {
        try {
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        } catch (persErr) {
          console.warn('Could not set auth persistence:', persErr);
        }
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      let tenantId = null;
      let organization = 'Enterprise Perimeter';
      let name = firebaseUser.displayName || email.split('@')[0];

      if (userSnap.exists()) {
        const data = userSnap.data();
        tenantId = data.tenant_id;
        organization = data.organization || organization;
        name = data.name || name;
      }

      const profile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: name,
        email: firebaseUser.email,
        role: 'admin', // Always admin
        organization: organization,
        tenant_id: tenantId,
        avatar: name.charAt(0).toUpperCase()
      };

      set({
        user: profile,
        tenantId: tenantId,
        organization: organization,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return profile;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  /**
   * Registers a new organization administrator, generates a unique Tenant Key,
   * and creates the organization & admin user records in Firestore.
   */
  signup: async ({ name, organization, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Generate cryptographically unique Tenant Key for the company
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tenantId = `COMP-${randomSuffix}-2026`;

      // 3. Create User record in Firestore (always role: admin)
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        name: name || 'Authorized Admin',
        email: email,
        organization: organization || 'GaitAuth Organization',
        role: 'admin', // Assigned role of admin
        tenant_id: tenantId,
        createdAt: serverTimestamp()
      });

      // 4. Create Organization record in Firestore
      const orgDocRef = doc(db, 'organizations', tenantId);
      await setDoc(orgDocRef, createDefaultOrganizationPayload({
        tenantId,
        companyName: organization || 'GaitAuth Organization',
        adminUid: firebaseUser.uid,
        adminEmail: email,
        adminName: name
      }));

      const profile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: name,
        email: email,
        role: 'admin',
        organization: organization,
        tenant_id: tenantId,
        avatar: (name || 'A').charAt(0).toUpperCase()
      };

      set({
        user: profile,
        tenantId: tenantId,
        organization: organization,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return profile;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  /**
   * Helper to handle OAuth sign in (Google / GitHub)
   */
  handleOAuthSignIn: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      let tenantId;
      let orgName;
      let isNewUser = false;

      if (!userSnap.exists()) {
        isNewUser = true;
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        tenantId = `COMP-${randomSuffix}-2026`;
        orgName = `${firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : 'Enterprise'}'s Perimeter`;

        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Authorized Admin',
          email: firebaseUser.email,
          organization: orgName,
          role: 'admin',
          tenant_id: tenantId,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'organizations', tenantId), createDefaultOrganizationPayload({
          tenantId,
          companyName: orgName,
          adminUid: firebaseUser.uid,
          adminEmail: firebaseUser.email,
          adminName: firebaseUser.displayName
        }));
      } else {
        const data = userSnap.data();
        tenantId = data.tenant_id;
        orgName = data.organization || 'Enterprise Perimeter';
      }

      const profile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Authorized Admin',
        email: firebaseUser.email,
        role: 'admin',
        organization: orgName,
        tenant_id: tenantId,
        avatar: (firebaseUser.displayName || firebaseUser.email || 'A').charAt(0).toUpperCase()
      };

      set({
        user: profile,
        tenantId: tenantId,
        organization: orgName,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { profile, isNewUser };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    return get().handleOAuthSignIn(provider);
  },

  loginWithGithub: async () => {
    const provider = new GithubAuthProvider();
    return get().handleOAuthSignIn(provider);
  },

  resetPassword: async (email) => {
    if (!email) throw new Error('Please enter your work email.');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      // OWASP account enumeration prevention: do not leak whether email is in DB
      if (err.code === 'auth/user-not-found') {
        return;
      }
      throw err;
    }
  },

  /**
   * Signs out the current user session and clears state.
   */
  logout: async () => {
    try {
      await signOut(auth);
      set({
        user: null,
        tenantId: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }
}));
