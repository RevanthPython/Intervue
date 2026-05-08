import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import the Firebase configuration
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const isPermissionError = error?.code === 'permission-denied' || (error instanceof Error && error.message.includes('permission-denied'));
  
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: error?.code,
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isSignedIn: !!auth.currentUser
    },
    operationType,
    path
  };

  console.error('Firestore Error Details:', errInfo);
  
  if (isPermissionError && errInfo.isLocal) {
    console.warn("DEBUG: If you see permission-denied locally, ensure your Firebase project allows 'localhost' in Authentication authorized domains and checking your Firestore rules.");
  }

  throw new Error(JSON.stringify(errInfo));
}

// Connection Test
async function testConnection() {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;
  
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test successful.");
  } catch (error: any) {
    if (error?.message?.includes('failed-precondition')) {
      console.warn("Firestore requires indexes or configuration that might be missing locally.");
    }
  }
}
testConnection();
