import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore, collection, addDoc, serverTimestamp, getDoc,
  query, doc, setDoc, onSnapshot, orderBy, limit,
  updateDoc, where, collectionData
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Reactive signals
  messages = signal<any[]>([]);
  lastMessage = signal<any>(null);
  chats = signal<any[]>([]);
  marked = signal<boolean>(false);
  currentUserId = signal<string | null | undefined>('');

  private auth = inject(Auth);
  private db = inject(Firestore);
  private unsubscribedMessages: (() => void) | null = null;

  constructor() {
    // Track currently authenticated user
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserId.set(user?.uid);
    });
  }

  /**
   * Stores user info in Firestore if it doesn't already exist
   */
  async storeUsersInfo(user: any, displayName: string | null, email: string | null, photoURL: string | null) {
    if (!user) return;
    const dataRef = doc(this.db, "users", user.uid);
    const snapshot = await getDoc(dataRef);

    if (!snapshot.exists()) {
      await setDoc(dataRef, {
        email: email,
        displayName: displayName || '',
        uid: user.uid,
        profilePic: photoURL || ''
      });
    }
  }

  /**
   * Real-time listener for all users except the current user
   */
  getSignedInUsers(currentUserId: string | null, callback: (users: any[]) => void): () => void {
    const usersRef = collection(this.db, 'users');
    const queryRef = query(usersRef, where('uid', '!=', currentUserId));

    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      callback(users);
    }, (error) => {
      console.error('Error fetching users:', error);
      callback([]);
    });

    return unsubscribe;
  }

  /**
   * Get and listen to the current user's profile info
   */
  getCurrentUserInfo(id: string, callback: (data: any) => void): () => void {
    const userRef = doc(this.db, "users", id);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }

  /**
   * Sends a message from sender to receiver and updates chat metadata
   */
  async sendMessage(senderId: string, receiverId: string, text: string) {
    const chatId = [senderId, receiverId].sort().join('_');
    const chatRef = doc(this.db, `chats/${chatId}`);
    const msgRef = collection(this.db, `chats/${chatId}/messages`);
    const user = this.auth.currentUser;
    if (!user) return;

    await addDoc(msgRef, {
      senderId,
      receiverId,
      text,
      email: user.email,
      status: 'sent',
      timeStamp: serverTimestamp()
    });

    await setDoc(chatRef, {
      users: [senderId, receiverId],
      lastMessage: text,
      updatedAt: serverTimestamp(),
      lastSeen: {
        [senderId]: serverTimestamp()
      }
    }, { merge: true });
  }

  /**
   * Real-time listener for messages in the current chat
   */
  async getMessages(senderId: string | undefined, receiverId: string | undefined) {
    // Remove previous message listener
    if (this.unsubscribedMessages) this.unsubscribedMessages();

    if (!senderId || !receiverId) return;

    const chatId = [senderId, receiverId].sort().join("_");
    const msgRef = collection(this.db, `chats/${chatId}/messages`);
    const queryData = query(msgRef, orderBy("timeStamp"));

    this.unsubscribedMessages = onSnapshot(queryData, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.messages.set(msgs);
    });
  }

  /**
   * Real-time listener for the last message between two users
   */
  getLastMessageBetweenUsers(user1: string | null, user2: string | null, callback: (message: any) => void): () => void {
    const chatId = [user1, user2].sort().join("_");
    const msgRef = collection(this.db, `chats/${chatId}/messages`);
    const q = query(msgRef, orderBy("timeStamp", 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapShot) => {
      const data = snapShot.docs[0]?.data() || null;
      callback(data);
    }, (error) => {
      console.error("Error fetching last message:", error);
      callback(null);
    });

    return unsubscribe;
  }

  /**
   * Loads all chats into signal for reactive use
   */
  async loadChats() {
    const collectionRef = collection(this.db, 'chats');
    collectionData(collectionRef, { idField: 'id' }).subscribe((chats: any[]) => {
      this.chats.set(chats);
    });
  }

  /**
   * Marks the chat as read by updating `lastSeen` for the current user
   */
  async markAsRead(chatId: string) {
    this.marked.set(false);

    try {
      const chatRef = doc(this.db, `chats/${chatId}`);
      await updateDoc(chatRef, {
        [`lastSeen.${this.currentUserId()}`]: serverTimestamp()
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    } finally {
      this.marked.set(true);
    }
  }
}
