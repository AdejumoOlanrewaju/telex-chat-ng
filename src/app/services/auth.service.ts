import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, ErrorFn, sendEmailVerification, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ChatService } from './chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signOut } from 'firebase/auth';
import { AlertServiceService } from './alert-service.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private snackBar = inject(MatSnackBar)
  alertService = inject(AlertServiceService)
  constructor(private router: Router, private auth: Auth, private chatService: ChatService) { }

  async signup(emailControl: any, passwordControl: any, nameControl: any,
    profilePicControl: any) {
    try {
      const email = emailControl.value;
      const password = passwordControl.value;
      const cred = await createUserWithEmailAndPassword(this.auth, email, password)
      await updateProfile(cred.user, {
        displayName : nameControl.value,
        photoURL : profilePicControl.value
      })

      await sendEmailVerification(cred.user)
      this.alertService.showSuccess("Signup successful")
      this.alertService.showInfo("A verification link has been sent to your email (spam)", 7000)

      this.router.navigate(['/login'])
      return cred
    } catch (err: ErrorFn | any) {
      this.snackBar.open(err, "ok", {
        panelClass: ['snackbar-error']
      })
      throw (err)
    }
  }

  async login(email: any, password: any) {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password)
      if (!cred.user.emailVerified) {
        await signOut(this.auth)
        this.alertService.showError('Pls verify email to sign in')
      } else {
        console.log(cred);
        const user = cred.user
        this.chatService.storeUsersInfo(user, user.displayName, user.email, user.photoURL)
        this.router.navigate(['/chat'])
      }
    } catch (err: ErrorFn | any) {
      this.snackBar.open(err, "ok", {
        panelClass: ['snackbar-error']
      })
      throw (err)

    }

  }
}
