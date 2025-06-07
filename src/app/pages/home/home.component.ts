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
  public searchInput = new FormControl('')
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
  allUsers : any[] = [];
  
  

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
    //   console.log("Last Message : ", this.chatService.lastMessage())
    // });

  }

  ngOnInit(): void {}

  async getCurrentUserInfo() {
    this.userVar = await this.chatService.getCurrentUserInfo(this.currentUserId())
  }

  async signedInUsersFunc() {
    let users = await this.chatService.getSignedInUsers(this.currentUserId())

    const userPromises = users.map(async (user: any) => {
      try{
        const lastMsg:any = await this.chatService.getLastMessageBetweenUsers(this.currentUserId(), user.uid);
        return { ...user, lastMessage : lastMsg?.text || ''}
      }catch(err){
        console.log(`Error fetching message for ${user.uid}: `, err)
        return {...user, lastMessage : ''}
      }
    })
    users = await Promise.all(userPromises)
    this.allUsers = users;
    this.signedInUsers = users
    return this.signedInUsers;
  }

  selectUser(user: any) {
    this.selectedUser.set(user);
    this.receiverId.set(user.uid)
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
      if (messageVal !== "") {
        this.chatService.sendMessage(this.senderId(), this.receiverId(), messageVal)
      }
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
    // console.log(this.chatService.messages())
  }

  isCurrentUser(userId: any) {
    return this.currentUserId() == userId

  }

  searchUserFunc(){
    const searchVal = this.searchInput.value?.toLowerCase()
    if(searchVal?.trim() == ""){
      this.signedInUsers = this.allUsers
    }else{
      this.signedInUsers = this.allUsers.filter((user: any) => {
        return user.displayName.toLowerCase().includes(searchVal)
      })

    }
  }

}

