import { Component, effect, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { Auth, signOut } from '@angular/fire/auth';
import { collection, doc, Firestore, getDocs, limit, query, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
import { RealtimeService } from '../../services/realtime.service';
import { HoursAgoPipe } from "../../pipes/hours-ago.pipe";
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AlertServiceService } from '../../services/alert-service.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, CommonModule, HoursAgoPipe, TimeAgoPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  // ViewChilds for DOM access
  @ViewChild('sideMenu') sideMenu!: ElementRef;
  @ViewChild('chatMainContainer') ctMainContainer!: ElementRef;

  // Injected services
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  public chatService = inject(ChatService);
  public alertService = inject(AlertServiceService);
  public realtimeService = inject(RealtimeService);

  // Form controls
  protected messageControl = new FormControl('');
  public searchInput = new FormControl('');
  public searchChatInput = new FormControl('');

  // Firebase refs and signals
  public dataRef = collection(this.db, "messages");
  public messageUnsbscribers: (() => void)[] = [];
  messages = signal<any[]>([]);

  // User and state management
  user: User | null = null;
  hasProfile: boolean = false;
  currentUserId = signal<string>('');
  senderId = signal<any>('');
  receiverId = signal<string>('');
  signedInUsers!: any;
  userVar!: any;
  selectedUser = signal<any>(null);
  allUsers: any[] = [];
  userStatus: any = null;
  chats = this.chatService.chats;
  activeChatUserId: string | null = null;
  isSearchOpen: boolean = false;
  isMessageBox: boolean = false;
  unsubscribedInfo: any;
  isUserListLoading = false;
  isMessagesLoading = false;
  isSendingMessage = false;

  constructor() {
    // Watch for user auth state changes
    onAuthStateChanged(this.auth, (user: any) => {
      if (!user) {
        this.router.navigate(['login']);
        return;
      }
      this.user = user;
      this.currentUserId.set(user.uid);
      this.senderId.set(user.uid);
      this.getCurrentUserInfo();
      this.signedInUsersFunc();
    });
  }

  ngOnInit(): void {
    this.chatService.loadChats();
  }

  // Toggle chat search bar
  toggleChatSearch(ev: MouseEvent) {
    ev.stopPropagation();
    this.isSearchOpen = !this.isSearchOpen;
    this.hasProfile = false;
  }

  closeChatSearch() {
    this.isSearchOpen = false;
  }

  // Check if the user has unread messages
  getUnreadCountForUser(user: any) {
    const chats = this.chats();
    const currentUserId: any = this.currentUserId();
    const chat = chats.find((chat: any) =>
      chat.users.includes(currentUserId) && chat.users.includes(user.uid)
    );
    if (!chat) return false;
    const lastSeen = chat.lastSeen?.[currentUserId];
    const updatedAt = chat.updatedAt;
    if (!updatedAt) return false;
    return updatedAt?.toMillis && lastSeen?.toMillis && updatedAt.toMillis() > lastSeen.toMillis();
  }

  // Open existing chat and mark it as read
  async openChatWith(user: any) {
    const chats: any[] = this.chats();
    const currentUserId: any = this.currentUserId();
    const chat = chats.find((chat: any) =>
      chat.users.includes(currentUserId) && chat.users.includes(user.uid)
    );
    if (!chat) return;
    if (chat.lastMessage && chat.updatedAt) {
      await this.chatService.markAsRead(chat.id);
    }
  }

  getUserStatus(userId: string) {
    return this.realtimeService.getUserStatus(userId);
  }

  // Fetch current user profile from Firestore
  async getCurrentUserInfo() {
    this.unsubscribedInfo = this.chatService.getCurrentUserInfo(this.currentUserId(), (userData) => {
      this.userVar = userData;
    });
  }

  // Load signed-in users and subscribe to last message + status
  signedInUsersFunc() {
    this.isUserListLoading = true;
    const currentUserId = this.currentUserId();
    const unsubscribe = this.chatService.getSignedInUsers(currentUserId, (users: any[]) => {
      users.forEach((user: any, index: number) => {
        const unsub = this.chatService.getLastMessageBetweenUsers(currentUserId, user.uid, (lastMsg) => {
          users[index]['lastMessage'] = lastMsg || '';
          this.signedInUsers = [...users].sort((a: any, b: any) => {
            const timeA = a['lastMessage']?.timeStamp?.seconds || 0;
            const timeB = b['lastMessage']?.timeStamp?.seconds || 0;
            return timeB - timeA;
          });
        });
        this.realtimeService.trackUser(user.uid);
        this.messageUnsbscribers.push(unsub);
      });
      this.allUsers = users;
    });
    this.messageUnsbscribers.push(unsubscribe);
    this.isUserListLoading = false;
    return this.allUsers;
  }

  // When a user is clicked in the chat list
  async selectUser(user: any) {
    this.sideMenu.nativeElement.classList.add("slideOut");
    this.sideMenu.nativeElement.classList.remove("slideIn");
    this.ctMainContainer.nativeElement.classList.add("slideIn");
    this.ctMainContainer.nativeElement.classList.remove("slideOut");
    this.isMessageBox = true;
    this.selectedUser.set(user);
    this.receiverId.set(user.uid);
    const sender = this.senderId();
    const receiver = this.receiverId();
    if (sender && receiver) {
      this.getMessages();
    }
    const userRef = doc(this.db, `users/${this.senderId()}`);
    await updateDoc(userRef, { lastSeen: serverTimestamp() });
    this.openChatWith(user);
  }

  async clickChatVisibility(user: any) {
    this.activeChatUserId = user?.uid;
    this.openChatWith(user);
  }

  showMainPanel() {
    this.sideMenu.nativeElement.classList.remove("slideOut");
    this.sideMenu.nativeElement.classList.add("slideIn");
    this.ctMainContainer.nativeElement.classList.add("slideOut");
    this.ctMainContainer.nativeElement.classList.remove("slideIn");
  }

  // Send a message
  async sendMessage() {
    try {
      const messageVal = this.messageControl.value?.trim();
      if (messageVal) {
        this.isSendingMessage = true;
        this.chatService.sendMessage(this.senderId(), this.receiverId(), messageVal);
        this.scrollToBottomFunc();
      }
      this.messageControl.setValue('');
      this.getMessages();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSendingMessage = false;
    }
  }

  async logoutFunc() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  toggleProfile(ev: MouseEvent) {
    ev.stopPropagation();
    this.hasProfile = !this.hasProfile;
    this.isSearchOpen = false;
  }

  // Load messages between two users
  async getMessages() {
    this.isMessagesLoading = true;
    const sender = this.senderId();
    const receiver = this.receiverId();
    if (sender && receiver) {
      await this.chatService.getMessages(sender, receiver);
    }
    this.isMessagesLoading = false;
  }

  isCurrentUser(userId: any) {
    return this.currentUserId() === userId;
  }

  // Filter user list based on search
  searchUserFunc() {
    const searchVal = this.searchInput.value?.toLowerCase();
    this.signedInUsers = !searchVal?.trim()
      ? this.allUsers
      : this.allUsers.filter((user: any) =>
          user.displayName.toLowerCase().includes(searchVal)
        );
  }

  // Highlight message that matches chat search
  searchChatFunc(messages: any[]) {
    const searchValue = this.searchChatInput.value?.toLowerCase();
    if (!searchValue?.trim() || messages.length === 0) return;
    const foundIndex = messages.findIndex((msg) =>
      msg.text.toLowerCase().includes(searchValue)
    );
    if (foundIndex !== -1) {
      const messageEl = document.getElementById(`msg-${foundIndex}`);
      if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.classList.add("highlighted");
        setTimeout(() => messageEl.classList.remove("highlighted"), 2000);
      }
    } else {
      console.log('No message found');
      this.alertService.showError("No message found", 100000);
    }
  }

  // Format message timestamp for UI display
  formatMessageTime(timestamp: any): string {
    const messageDate = timestamp?.toDate?.() ?? new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const diffInDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric'
      }).format(messageDate);
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else {
      const day = String(messageDate.getDate()).padStart(2, '0');
      const month = String(messageDate.getMonth() + 1).padStart(2, '0');
      const year = String(messageDate.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    }
  }

  async loadChats() {
    const snapRef = collection(this.db, 'chats');
    const snapShot = await getDocs(query(snapRef, limit(1)));
    snapShot.docs.forEach(doc => ({ id: doc.id, ...doc.data() }));
  }

  scrollToBottomFunc() {
    setTimeout(() => {
      const el = document.querySelector(".chat-box");
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  trackByMessageId(index: number, item: any): string {
    return item.id || index.toString();
  }

  trackByUid(index: number, user: any) {
    return user.uid;
  }

  cleanupMessageListeners() {
    this.messageUnsbscribers.forEach(unsub => unsub());
    this.messageUnsbscribers = [];
    if (this.unsubscribedInfo) this.unsubscribedInfo();
  }

  // Close popups on document click
  @HostListener('document:click')
  handleDocumentClick() {
    this.hasProfile = false;
    this.isSearchOpen = false;
  }

  open(ev: MouseEvent) {
    ev.stopPropagation();
  }

  ngOnDestroy() {
    this.cleanupMessageListeners();
  }
}
