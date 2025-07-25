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
  // Inject dependencies
  private snackBar = inject(MatSnackBar)
  alertService = inject(AlertServiceService)
  router = inject(Router)
  auth = inject(Auth)
  chatService = inject(ChatService)

  constructor() { }

  /**
   * Handles new user sign up using email/password.
   * Updates the user profile and sends verification email.
   */
  async signup(emailControl: any, passwordControl: any, nameControl: any,
    profilePicControl: any) {
    try {
      const email = emailControl.value;
      const password = passwordControl.value;

      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(this.auth, email, password)
      // Update profile with name and profile picture
      await updateProfile(cred.user, {
        displayName: nameControl.value,
        photoURL: profilePicControl.value
      })
      // Show success message
      this.alertService.showSuccess("Signup successful")
      // Send verification email
      await sendEmailVerification(cred.user)
      // Redirect to verify email page
      this.router.navigate(['/verify-email'])
      return cred
    } catch (err: ErrorFn | any) {
      // Show error message
      this.snackBar.open(err, "ok", {
        panelClass: ['snackbar-error']
      })
      throw (err)
    }
  }

  /**
 * Handles user login and checks for email verification.
 * Prevents access if user hasn't verified email.
 */
  async login(email: any, password: any) {
    try {
      // Attempt sign in
      const cred = await signInWithEmailAndPassword(this.auth, email, password)
      if (!cred.user.emailVerified) {
        // Force logout and notify if not verified
        await signOut(this.auth)
        this.alertService.showError('Pls verify email to sign in')
      } else {
        // Save user info to Firestore
        const user = cred.user
        this.chatService.storeUsersInfo(user, user.displayName, user.email, user.photoURL)
        // Navigate to chat
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
