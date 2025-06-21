import { Injectable, signal } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, getDocs, orderBy, where, query, doc, getDoc, setDoc, onSnapshot, limit } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  messages = signal<any[]>([])
  lastMessage = signal<any>(null)
  private unsubscribedMessages: (() => void) | null = null
  constructor(private db: Firestore, private auth: Auth) { }

  async storeUsersInfo(user: any, displayName: string | null, email: string | null, photoURL: string | null) {
    console.log(user)
    if (user) {
      const dataRef = doc(this.db, "users", user.user.uid)
      const snapshot = await getDoc(dataRef)
      console.log(displayName)
      if (!snapshot.exists()) {
        await setDoc(dataRef, {
          email: email,
          displayName: displayName || '',
          uid: user.user.uid,
          profilePic: photoURL || ''
        })
        console.log("saved")
      }
    }
  }

  async getSignedInUsers(currentUserId: any) {
    const queryData = query(collection(this.db, "users"), where('uid', '!=', currentUserId))
    const querySnapShot = (await getDocs(queryData)).docs.map(doc => doc.data())
    return querySnapShot;
  }

  async getCurrentUserInfo(id: any) {
    const queryData = doc(this.db, "users", id)
    const querySnapShot = (await getDoc(queryData)).data()
    return querySnapShot;

  }

  async sendMessage(senderId: string | undefined, receiverId: string | undefined, text: any) {
    const chatId = [senderId, receiverId].sort().join("_")
    const msgRef = collection(this.db, `chats/${chatId}/messages`)
    const user = this.auth.currentUser
    if (!user) return;
    await addDoc(msgRef, {
      senderId,
      receiverId,
      text,
      email: user.email,
      status: 'sent',
      timeStamp: serverTimestamp()
    })


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
    // return new Promise((resolve, reject) => {
    //   const chatId = [user1, user2].sort().join("_");
    //   const msgRef = collection(this.db, `chats/${chatId}/messages`);
    //   const q = query(msgRef, orderBy("timeStamp", 'desc'), limit(1));
    //   onSnapshot(q, (snapShot) => {
    //     const data = snapShot.docs[0]?.data()
    //     console.log(data)
    // this.lastMessage.set(data)

    //     resolve(data) 
    //     this.lastMessage.set(data)
    //   }, (error) => {
    //     reject(error)
    //   })

    // })

    // const snapshot = await getDocs(q);
    // const last = snapshot.docs[snapshot.docs.length - 1]?.data();
    // snapshot.docs.forEach(data => console.log(data.data()))
    // this.lastMessage.set(last)

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

}
