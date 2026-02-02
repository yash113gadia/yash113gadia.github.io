import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ============ CONTACT MESSAGES ============

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
}

export const submitContactMessage = async (data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const docRef = await addDoc(collection(db, 'contacts'), {
      ...data,
      createdAt: serverTimestamp(),
      read: false
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error submitting contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
};

// ============ PROJECT VIEWS ============

export interface ProjectStats {
  views: number;
  lastViewed: Timestamp;
}

export const trackProjectView = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projectViews', projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      // Increment existing view count
      await setDoc(projectRef, {
        views: increment(1),
        lastViewed: serverTimestamp()
      }, { merge: true });
    } else {
      // Create new document
      await setDoc(projectRef, {
        views: 1,
        lastViewed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error tracking project view:', error);
  }
};

export const getProjectViews = async (projectId: string): Promise<number> => {
  try {
    const projectRef = doc(db, 'projectViews', projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
      return projectSnap.data().views || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting project views:', error);
    return 0;
  }
};

// ============ PAGE VIEWS ============

export const trackPageView = async (page: string): Promise<void> => {
  try {
    const pageRef = doc(db, 'pageViews', page);
    const pageSnap = await getDoc(pageRef);

    if (pageSnap.exists()) {
      await setDoc(pageRef, {
        views: increment(1),
        lastViewed: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(pageRef, {
        views: 1,
        lastViewed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};
