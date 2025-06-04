import { Component, effect, inject, OnInit, signal } from '@angular/core';
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
  public chatService = inject(ChatService)

  protected messageControl = new FormControl('')
  public dataRef = collection(this.db, "messages")

  messages = signal<any[]>([]);
  user: User | null = null;
  hasProfile: boolean = false;
  currentUserId = signal<string | null>('');
  senderId = signal<any>('');
  receiverId = signal<string | undefined>('');
  signedInUsers!: any;
  userVar !: any;
  selectedUser = signal<any>(null);
  constructor() {
    onAuthStateChanged(this.auth, (user: any) => {
      if (!user) this.router.navigate(['login'])
      this.user = user
      this.currentUserId.set(user?.uid ?? null);
      this.senderId.set(user?.uid ?? null)
      this.getCurrentUserInfo()
      this.signedInUsersFunc().then((data) => {
        this.receiverId.set(data[0].uid)
        this.getMessages()
      })

    })
    // effect(() => {
    //   console.log('Messages updated:', this.chatService.messages());
    // });

  }

  ngOnInit(): void {


  }

  async getCurrentUserInfo() {
    this.userVar = await this.chatService.getCurrentUserInfo(this.currentUserId())
  }

  async signedInUsersFunc() {
    this.signedInUsers = await this.chatService.getSignedInUsers(this.currentUserId())
    return this.signedInUsers
  }

  selectUser(user: any) {
    this.selectedUser.set(user);
    this.receiverId.set(user.uid)
    console.log("selected receiver id: ", this.receiverId());

    setTimeout(() => {
      const sender = this.senderId()
      const receiver = this.receiverId()
      if (sender && receiver) {
        this.getMessages()
      }
    }, 0)
  }

  async sendMessage() {
    try {
      let messageVal = this.messageControl.value?.trim()
      console.log(this.receiverId())
      
      this.chatService.sendMessage(this.senderId(), this.receiverId(), messageVal)
      this.messageControl.setValue('')
      this.getMessages()
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

  async getMessages() {
    const sender = this.senderId()
    const receiver = this.receiverId()
    if (sender && receiver) {
      await this.chatService.getMessages(this.senderId(), this.receiverId())
    }
    this.chatService.getMessages(sender, receiver).then(data => {
    })
    console.log(this.chatService.messages())
  }


  isCurrentUser(userId: any) {
    return this.currentUserId() == userId

  }


}

