import { inject, Injectable, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, onValue, ref, serverTimestamp, set } from '@angular/fire/database';
import { onAuthStateChanged } from 'firebase/auth';
import { onDisconnect } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  usersStatus = signal<Record<string, { status: "online" | "offline", lastChanged: number }>>({})

  auth = inject(Auth)
  db = inject(Database)
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if(!user) return;

      const uid = user.uid
      console.log(user.uid)
      const statusRef = ref(this.db, `status/${uid}`)
      const isOffline = {status : 'offline', lastChanged : serverTimestamp()}
      const isOnline = {status : 'online', lastChanged : serverTimestamp()}

      const connecteRef = ref(this.db, `.info/connected`)

      onValue(connecteRef, (snapShot) => {
        if(snapShot.val() === false) return;

        onDisconnect(statusRef).set(isOffline).then(() => {
          set(statusRef, isOnline)
        })
      })
    })
  }

  trackUser(userId: string) {
    const statusRef = ref(this.db, `status/${userId}`)

    onValue(statusRef, (snapShot) => {
      const data = snapShot.val()
      if (data) {
        this.usersStatus.update((prev) => ({
          ...prev,
          [userId]: {
            status: data.status,
            lastChanged: data.lastChanged
          }
        }))
      }
    })
  }

  getUserStatus(userId: string) {
    return this.usersStatus()[userId]
  }
}
