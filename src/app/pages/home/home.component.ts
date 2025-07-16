import { Component, effect, ElementRef, HostListener, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from "@angular/forms"
import { Auth, authState, signOut } from '@angular/fire/auth';
import { addDoc, collection, collectionData, doc, Firestore, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
import { RealtimeService } from '../../services/realtime.service';
import { HoursAgoPipe } from "../../pipes/hours-ago.pipe";
import { toSignal } from "@angular/core/rxjs-interop"
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule, HoursAgoPipe, TimeAgoPipe],
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
  public searchChatInput = new FormControl('')
  public dataRef = collection(this.db, "messages")
  public messageUnsbscribers: (() => void)[] = []

  messages = signal<any[]>([]);
  user: User | null = null;
  hasProfile: boolean = false;
  currentUserId = signal<string | null>('');
  senderId = signal<any>('');
  receiverId = signal<string>('');
  signedInUsers!: any;
  userVar !: any;
  selectedUser = signal<any>(null);
  allUsers: any[] = [];
  userStatus: any = null
  chats = this.chatService.chats
  activeChatUserId: string | null = null
  isSearchOpen: boolean = false
  isMessageBox: boolean = false
  unsubscribedInfo : any;

  constructor() {

    onAuthStateChanged(this.auth, (user: any) => {
      if (!user) this.router.navigate(['login'])
      this.user = user
      this.currentUserId.set(user?.uid ?? null);
      this.senderId.set(user?.uid ?? null)
      this.getCurrentUserInfo()
      if (user) {
        this.signedInUsersFunc().then((data) => {
          this.getMessages()
          data.forEach((user: any) => {
            this.realtimeService.trackUser(user.uid)
          })
          setTimeout(() => {
            data.forEach((user: { uid: string; }) => {
              this.realtimeService.getUserStatus(user.uid);
            });
          }, 1000);
        })
      } else {

      }

    })
  }

  ngOnInit(): void {
    this.chatService.loadChats()
  }

  toggleChatSearch(ev: MouseEvent) {
    ev.stopPropagation()
    this.isSearchOpen = !this.isSearchOpen
    this.hasProfile = false
  }

  closeChatSearch() {
    this.isSearchOpen = false
  }

  getUnreadCountForUser(user: any) {
    const chats = this.chats();
    const currentUserId: any = this.currentUserId();

    const possibleChat: any = chats.find((chat: any) =>
      chat.users.includes(currentUserId) && chat.users.includes(user.uid)
    );


    if (!possibleChat) return false;

    const lastSeen = possibleChat.lastSeen?.[currentUserId];
    const updatedAt = possibleChat.updatedAt;

    if (!updatedAt) return false;


    if (updatedAt?.toMillis && lastSeen?.toMillis) {
      if (updatedAt.toMillis() > lastSeen.toMillis()) {
        return true;
      }
    }

    return false;
  }

  async openChatWith(user: any) {
    const chats: any[] = this.chats();
    const currentUserId: any = this.currentUserId();

    let chat = chats.find((chat: any) =>
      chat.users.includes(currentUserId) && chat.users.includes(user.uid)
    );

    if (!chat) {
      // Create new chat, do NOT mark as read yet (no message yet)
      return;
    } else {
      if (chat.lastMessage && chat.updatedAt) {
        // Only mark as read if there are messages

        await this.chatService.markAsRead(chat.id);
      }
    }


  }

  getUserStatus(userId: string) {

    return this.realtimeService.getUserStatus(userId)
  }

  async getCurrentUserInfo() {
    this.unsubscribedInfo = this.chatService.getCurrentUserInfo(this.currentUserId(), (userData) => {
      this.userVar = userData
    })
    // this.userVar = await this.chatService.getCurrentUserInfo(this.currentUserId())
  }

  async signedInUsersFunc() {
    let users = await this.chatService.getSignedInUsers(this.currentUserId())
    users.forEach((user: any, index: number) => {
      const unsubscribe = this.chatService.getLastMessageBetweenUsers(this.currentUserId(), user.uid,
        (lastMsg) => {
          users[index]['lastMessage'] = lastMsg || '';
          this.signedInUsers = [...users].sort((a: any, b: any): any => {
            const timeA = a['lastMessage']?.timeStamp?.seconds || 0
            const timeB = b['lastMessage']?.timeStamp?.seconds || 0
            return timeB - timeA
          })
        });
      this.messageUnsbscribers.push(unsubscribe)
    })

    this.allUsers = users;
    this.signedInUsers = [...users]
    return this.signedInUsers;
  }

  async selectUser(user: any) {
    this.sideMenu.nativeElement.classList.add("slideOut")
    this.sideMenu.nativeElement.classList.remove("slideIn")
    this.ctMainContainer.nativeElement.classList.add("slideIn")
    this.ctMainContainer.nativeElement.classList.remove("slideOut")

    this.isMessageBox = true
    this.clickChatVisibility(user)
    this.selectedUser.set(user);
    this.receiverId.set(user.uid)
    const sender = this.senderId()
    const receiver = this.receiverId()

    if (sender && receiver) {
      this.getMessages()
      console.log(this.chatService.messages())

    }
    const userRef = doc(this.db, `users/${this.senderId()}`);
    await updateDoc(userRef, {
      lastSeen: serverTimestamp()
    });
    this.openChatWith(user)


  }

  async clickChatVisibility(user: any) {
    this.activeChatUserId = user?.uid


    this.openChatWith(user)

  }

  showMainPanel() {
    this.sideMenu.nativeElement.classList.remove("slideOut")
    this.sideMenu.nativeElement.classList.add("slideIn")
    this.ctMainContainer.nativeElement.classList.add("slideOut")
    this.ctMainContainer.nativeElement.classList.remove("slideIn")
  }

  async sendMessage() {
    try {
      let messageVal: any = this.messageControl.value?.trim()
      if (messageVal !== "") {
        this.chatService.sendMessage(this.senderId(), this.receiverId(), messageVal)
        this.scrollToBottomFunc()
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

  toggleProfile(ev: MouseEvent) {
    ev.stopPropagation()
    this.hasProfile = !this.hasProfile
    this.isSearchOpen = false
  }

  async getMessages() {
    const sender = this.senderId()
    const receiver = this.receiverId()
    if (sender && receiver) {
      await this.chatService.getMessages(this.senderId(), this.receiverId())
    }
    // this.chatService.getMessages(sender, receiver)
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

  searchChatFunc(messages: any[]) {
    const searchValue = this.searchChatInput.value?.toLowerCase()

    if (searchValue?.trim() == "" || messages.length == 0) return

    const foundIndex = messages.findIndex((msg) => {
      return msg.text.toLowerCase().includes(searchValue)
    })

    if (foundIndex !== -1) {
      const messageEl = document.getElementById(`msg-${foundIndex}`)
      if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        messageEl.classList.add("highlighted")
        setTimeout(() => {
          messageEl.classList.remove("highlighted")
        }, 2000)
      }
    } else {
      console.log('No message found');

    }
  }

  formatMessageTime(timestamp: any): string {
    const messageDate = timestamp?.toDate?.() ?? new Date(timestamp);
    const now = new Date();

    // Strip the time to only compare dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today: show time
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric'
      }).format(messageDate);
    } else if (diffInDays === 1) {
      // Yesterday
      return "Yesterday";
    } else {
      // Older: show date as dd/MM/yy
      const day = String(messageDate.getDate()).padStart(2, '0');
      const month = String(messageDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const year = String(messageDate.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`; // e.g., "22/05/24"
    }
  }

  async loadChats() {
    const snapRef = collection(this.db, 'chats');
    const queryData = query(snapRef, limit(1))
    const snapShot = await getDocs(snapRef);

    snapShot.docs.forEach(doc => {
      return {
        id: doc.id,
        ...doc.data()
      }
    });
  }

  scrollToBottomFunc() {
    setTimeout(() => {
      const el = document.querySelector(".chat-box")
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }, 100)
  }

  trackByMessageId(index: number, item: any): string {
    return item.id || index.toString(); // Adjust depending on your message model
  }

  cleanupMessageListeners() {
    this.messageUnsbscribers.forEach(unsub => unsub())
    this.messageUnsbscribers = []
    if (this.unsubscribedInfo) this.unsubscribedInfo();

  }

  @HostListener('document:click')
  handleDocumentClick() {
    this.hasProfile = false
    this.isSearchOpen = false
  }

  open(ev: MouseEvent) {
    ev.stopPropagation()
  }

  ngOnDestroy() {
    this.cleanupMessageListeners()
  }
}

