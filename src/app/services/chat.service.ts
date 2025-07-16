import { inject, Injectable, signal } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, getDocs, orderBy, where, query, doc, getDoc, setDoc, onSnapshot, limit, updateDoc, collectionData, Timestamp } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
@Injectable({
  providedIn: 'root'
})


export class ChatService {
  messages = signal<any[]>([])
  lastMessage = signal<any>(null)
  chats = signal<[]>([])
  marked = signal<boolean>(false)
  private unsubscribedMessages: (() => void) | null = null

  auth = inject(Auth)
  db = inject(Firestore)


  currentUserId = signal<string | null | undefined>('')
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserId.set(user?.uid)
    })
  }



  async storeUsersInfo(user: any, displayName: string | null, email: string | null, photoURL: string | null) {
    if (user) {
      const dataRef = doc(this.db, "users", user.uid)
      const snapshot = await getDoc(dataRef)
      if (!snapshot.exists()) {
        await setDoc(dataRef, {
          email: email,
          displayName: displayName || '',
          uid: user.uid,
          profilePic: photoURL || ''
        })
      }
    }
  }

   async getSignedInUsers(currentUserId: any) {
    const queryData = query(collection(this.db, "users"), where('uid', '!=', currentUserId))
    const querySnapShot = (await getDocs(queryData)).docs.map(doc => doc.data())
    return querySnapShot;
  }

  getCurrentUserInfo(id: any, callback: (data: any) => void): () => void {
    const userRef = doc(this.db, "users", id);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback(null);
      }
    });

    return unsubscribe; // Caller can use this to stop listening later
  }


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

  async getMessages(senderId: string | undefined, receiverId: string | undefined) {
    if (this.unsubscribedMessages) {
      this.unsubscribedMessages()
    }
    if (!senderId && receiverId) return
    const chatId = [senderId, receiverId].sort().join("_")
    const msgRef = collection(this.db, `chats/${chatId}/messages`)
    const queryData = query(msgRef, orderBy("timeStamp"))
    this.unsubscribedMessages = onSnapshot(queryData, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      this.messages.set(msgs)
    })
  }

  getLastMessageBetweenUsers(user1: string | null, user2: string | null, callback: (message: any) => void): () => void {
    const chatId = [user1, user2].sort().join("_");
    const msgRef = collection(this.db, `chats/${chatId}/messages`);
    const q = query(msgRef, orderBy("timeStamp", 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapShot) => {
      const data = snapShot.docs[0]?.data() || null
      callback(data)
    }, (error) => {
      console.log("Error in onSnapShot: ", error)
      callback(null)
    })

    return unsubscribe

  }


  async loadChats() {
    const collectionRef = collection(this.db, 'chats')
    collectionData(collectionRef, { idField: 'id' }).subscribe((chats: any) => {
      this.chats.set(chats)
    })
  }

  async markAsRead(chatId: any) {
    this.marked.set(false)

    try {
      const chatRef = doc(this.db, `chats/${chatId}`);
      await updateDoc(chatRef, {
        [`lastSeen.${this.currentUserId()}`]: serverTimestamp()
      });

    } catch (err) {
      console.error(err);

    } finally {
      this.marked.set(true)

    }
  }



}
