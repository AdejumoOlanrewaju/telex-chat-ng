import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from "@angular/forms"
import { Auth, authState, signOut } from '@angular/fire/auth';
import { addDoc, collection, collectionData, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private auth = inject(Auth)
  private db = inject(Firestore)
  private router = inject(Router)
  private chatService = inject(ChatService)

  protected messageControl = new FormControl('')
  public dataRef = collection(this.db, "messages")

  messages !: any[];
  user: User | null = null;
  hasProfile: boolean = false;
  currentUserId: string | null = null
  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) this.router.navigate(['login'])
      this.user = user
    })
  }

  ngOnInit(): void {
    authState(this.auth).subscribe((user) => {
      this.currentUserId = user?.uid ?? null;
      if (this.currentUserId) {
        this.getMessages();
      }
    });
  }


  async sendMessage() {
    try {
      let messageVal = this.messageControl.value?.trim()
      this.chatService.sendMessage(messageVal)
      this.messageControl.setValue('')
    } catch (error) {
      throw (error)
    }
  }

  async logoutFunc() {
    await signOut(this.auth)
    this.router.navigate(['/login'])
  }

  toggleProfile() {
    this.hasProfile = !this.hasProfile
  }

  getMessages() {
    const queryData = query(collection(this.db, "messages"), orderBy("timeStamp"));
    onSnapshot(queryData, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(data);
      this.messages = data;
    });
  }

  isCurrentUser() {
    console.log(true)
    return true

  }


}

