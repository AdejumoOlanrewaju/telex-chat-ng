import { Component, effect, ElementRef, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from "@angular/forms"
import { Auth, authState, signOut } from '@angular/fire/auth';
import { addDoc, collection, collectionData, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
import { RealtimeService } from '../../services/realtime.service';
import { HoursAgoPipe } from "../../Pipe/hours-ago.pipe";
@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule, HoursAgoPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('sideMenu') sideMenu !: ElementRef;
  @ViewChild('chatMainContainer') ctMainContainer !: ElementRef;

  private auth = inject(Auth)
  private db = inject(Firestore)
  private router = inject(Router)
  public chatService = inject(ChatService)
  public realtimeService = inject(RealtimeService)

  protected messageControl = new FormControl('')
  public searchInput = new FormControl('')
  public dataRef = collection(this.db, "messages")
  public messageUnsbscribe: (() => void)[] = []

  messages = signal<any[]>([]);
  user: User | null = null;
  hasProfile: boolean = false;
  currentUserId = signal<string | null>('');
  senderId = signal<any>('');
  receiverId = signal<string | undefined>('');
  signedInUsers!: any;
  userVar !: any;
  selectedUser = signal<any>(null);
  allUsers: any[] = [];
  userStatus: any = null



  constructor() {
    onAuthStateChanged(this.auth, (user: any) => {
      if (!user) this.router.navigate(['login'])
      this.user = user
      this.currentUserId.set(user?.uid ?? null);
      this.senderId.set(user?.uid ?? null)
      this.getCurrentUserInfo()
      if(user){
        this.signedInUsersFunc().then((data) => {
          this.receiverId.set(data[0].uid)
          this.selectedUser.set(data[0])
          this.getMessages()
          data.forEach((user: any) => {
            this.realtimeService.trackUser(user.uid)
          })
          setTimeout(() => {
            data.forEach((user: { uid: string; }) => {
              const status = this.realtimeService.getUserStatus(user.uid);
              console.log(`Status for ${user.uid}:`, status);
            });
          }, 1000);
        })
      }else{

      }

    })
    // effect(() => {
    //   console.log('Messages updated:', this.chatService.messages());
    //   console.log("Last Message : ", this.chatService.lastMessage())
    // });

  }

  ngOnInit(): void { }

  getUserStatus(userId: string) {

    return this.realtimeService.getUserStatus(userId)
  }

  async getCurrentUserInfo() {
    this.userVar = await this.chatService.getCurrentUserInfo(this.currentUserId())
  }

  async signedInUsersFunc() {
    let users = await this.chatService.getSignedInUsers(this.currentUserId())

    const userPromises = users.map(async (user: any) => {
      try {
        const lastMsg = await this.chatService.getLastMessageBetweenUsers(this.currentUserId(), user.uid);
        console.log(lastMsg)
        return { ...user, lastMessage: lastMsg || '' }
      } catch (err) {
        console.log(`Error fetching message for ${user.uid}: `, err)
        return { ...user, lastMessage: '' }
      }
    })
    users = await Promise.all(userPromises)
    this.allUsers = users;
    this.signedInUsers = users
    return this.signedInUsers;
  }

  selectUser(user: any) {
    this.selectedUser.set(user);
    console.log()
    this.receiverId.set(user.uid)
    setTimeout(() => {
      const sender = this.senderId()
      const receiver = this.receiverId()
      if (sender && receiver) {
        this.getMessages()
      }
    }, 0)

    this.sideMenu.nativeElement.classList.add("slideOut")
    this.sideMenu.nativeElement.classList.remove("slideIn")
    this.ctMainContainer.nativeElement.classList.add("slideIn")
    this.ctMainContainer.nativeElement.classList.remove("slideOut")
  }

  showMainPanel() {
    this.sideMenu.nativeElement.classList.remove("slideOut")
    this.sideMenu.nativeElement.classList.add("slideIn")
    this.ctMainContainer.nativeElement.classList.add("slideOut")
    this.ctMainContainer.nativeElement.classList.remove("slideIn")
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
    this.chatService.getMessages(sender, receiver)
    // console.log(this.chatService.messages())
  }

  isCurrentUser(userId: any) {
    return this.currentUserId() == userId

  }

  searchUserFunc() {
    const searchVal = this.searchInput.value?.toLowerCase()
    if (searchVal?.trim() == "") {
      this.signedInUsers = this.allUsers
    } else {
      this.signedInUsers = this.allUsers.filter((user: any) => {
        return user.displayName.toLowerCase().includes(searchVal)
      })

    }
  }

  cleanupMessageListeners(){
    
  }

  ngOnDestroy(){

  }
}

