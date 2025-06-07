import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, ErrorFn, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ChatService } from './chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private snackBar = inject(MatSnackBar)

  constructor(private router: Router, private auth: Auth, private chatService: ChatService) { }

  async signup(emailControl: any, passwordControl: any, nameControl: any,
    profilePicControl: any) {
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
    } catch (err: ErrorFn | any) {
      this.snackBar.open(err, "ok", {
        panelClass: ['snackbar-error']
      })
      throw (err)
    }
  }

  async login(email: any, password: any) {
    try {
      await signInWithEmailAndPassword(this.auth, email, password)
      this.router.navigate(['/chat'])
    } catch (err: ErrorFn | any) {
      this.snackBar.open(err, "ok", {
        panelClass: ['snackbar-error']
      })
      throw (err)

    }

  }
}
