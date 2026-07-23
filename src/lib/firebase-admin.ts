import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = !getApps().length ? initializeApp({
  projectId: firebaseConfig.projectId,
}) : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export { getApps };
