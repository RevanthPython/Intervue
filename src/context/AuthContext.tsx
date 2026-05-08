import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, OperationType, handleFirestoreError, logout as firebaseLogout } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'candidate' | 'interviewer' | 'company' | 'admin';
  bio?: string;
  skills?: string[];
  domains?: string[];
  languages?: string[];
  location?: string;
  experience?: string;
  yearsOfExperience?: number;
  company?: string;
  jobTitle?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setRole: (role: UserProfile['role']) => Promise<void>;
  switchProfileRole: (role: UserProfile['role']) => Promise<void>;
  resetProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let isMounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (!isMounted) return;
      setUser(authUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (authUser) {
        const docRef = doc(db, 'users', authUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (!isMounted) return;
          if (docSnap.exists()) {
            setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            console.warn("Profile document not found for UID:", authUser.uid);
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          if (!isMounted) return;
          console.error("Profile listener error:", error);
          
          // If we are on localhost and get a permission error, it might be due to 
          // unauthorized domain during the first split second of auth propagation.
          // We wait a bit before giving up.
          if (error.code === 'permission-denied' && (window.location.hostname === 'localhost')) {
            setTimeout(() => {
                if (isMounted && !profile) {
                    console.log("Retrying profile fetch locally...");
                    // This is handled by onSnapshot automatically, but we keep the loading state true
                }
            }, 1000);
          } else {
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Safety timeout for loading state
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(timeout);
    };
  }, []);

  const setRole = async (role: UserProfile['role']) => {
    if (!user) return;
    
    // Check if profile already exists in Firestore to be absolutely sure
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.warn('Role already set in Firestore. Role switching is not allowed.');
        setProfile(docSnap.data() as UserProfile);
        return;
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role,
      createdAt: new Date().toISOString(),
    } as any;

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const switchProfileRole = async (role: UserProfile['role']) => {
    if (!user || !profile) return;
    
    // Allow role switching for admin or specific dev email
    const isAdmin = profile.role === 'admin' || user.email === 'revanthkumar.0709@gmail.com';
    
    if (!isAdmin) {
      console.warn('Role switching is only allowed for admins/testers.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), { role });
      setProfile({ ...profile, role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const resetProfile = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      setProfile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setRole, switchProfileRole, resetProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
