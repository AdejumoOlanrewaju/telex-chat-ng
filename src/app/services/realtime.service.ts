import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Database,
  onValue,
  ref,
  serverTimestamp,
  set,
  onDisconnect
} from '@angular/fire/database';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  // Stores status of all tracked users
  usersStatus = signal<Record<string, { status: 'online' | 'offline'; lastChanged: number }>>({});

  private auth = inject(Auth);
  private db = inject(Database);

  constructor() {
    // Track the auth state of current user
    onAuthStateChanged(this.auth, (user) => {
      if (!user) return;

      const uid = user.uid;
      const statusRef = ref(this.db, `status/${uid}`);
      const connectedRef = ref(this.db, `.info/connected`);

      const isOffline = {
        status: 'offline',
        lastChanged: serverTimestamp()
      };

      const isOnline = {
        status: 'online',
        lastChanged: serverTimestamp()
      };

      // Monitor Firebase's special .info/connected path to detect presence
      onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) return;

        // When user disconnects, mark offline
        onDisconnect(statusRef).set(isOffline).then(() => {
          // Immediately mark as online
          set(statusRef, isOnline);
        });
      });
    });
  }

  /**
   * Starts tracking a user's presence status
   */
  trackUser(userId: string) {
    const statusRef = ref(this.db, `status/${userId}`);

    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data.lastChanged === 'number') {
        this.usersStatus.update((prev) => ({
          ...prev,
          [userId]: {
            status: data.status,
            lastChanged: data.lastChanged
          }
        }));
      }
    });
  }

  /**
   * Returns current status of a tracked user
   */
  getUserStatus(userId: string) {
    return this.usersStatus()[userId];
  }
}
