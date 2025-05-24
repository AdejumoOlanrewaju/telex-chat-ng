import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private db : Firestore, private auth : Auth) { }

  async sendMessage(text: any ){
    const user = this.auth.currentUser
    if(!user || !text.trim()) return;
    const dataRef = collection(this.db, "messages")
    const data = {
      text, 
      email : user.email,
      senderId : user.uid,
      timeStamp : serverTimestamp(),
      status : "sent"
    }
    console.log('Message Sent:', data)
    await addDoc(dataRef, data)
    
  }
}
