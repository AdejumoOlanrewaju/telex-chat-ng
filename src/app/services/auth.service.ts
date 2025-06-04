import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  constructor(private router: Router, private auth: Auth, private chatService : ChatService) { }

  async signup(emailControl: any, passwordControl: any, nameControl: any,
profilePicControl : any) {
    try {
      const email = emailControl.value;
      const password = passwordControl.value

      createUserWithEmailAndPassword(this.auth, email, password).then(user => {
        console.log(user.user.uid)
        this.chatService.storeUsersInfo(
          user,
          nameControl.value,
          emailControl.value,
          profilePicControl.value
        )
      })
      this.router.navigate(['/login'])
    } catch (err) {
      throw (err)
    }

  }

  async login(emailControl: any, passwordControl: any) {
    try {
      const email = emailControl.value!;
      const password = passwordControl.value!

      await signInWithEmailAndPassword(this.auth, email, password)
      this.router.navigate(['/chat'])
    } catch (err) {
      throw (err)
    }

  }
}
