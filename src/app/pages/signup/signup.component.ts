import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { MatSnackBar } from "@angular/material/snack-bar"

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  constructor() { }
  showPs: boolean = false
  loading: boolean = false
  @ViewChild('passwordInput') passwordInput !: ElementRef;

  private auth = inject(Auth)
  private router = inject(Router)
  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private snackBar = inject(MatSnackBar)


  protected nameControl = new FormControl('', [Validators.required])
  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])
  protected profilePicControl = new FormControl('')

  async signup() {
    try {
      this.loading = true
      console.log(this.loading)
      if (this.formValid()) {
        await this.authService.signup(this.emailControl, this.passwordControl, this.nameControl, this.profilePicControl)
      }
    } catch (error: any) {
      console.log(error)
      const errorMessage = this.getFirebaseErrorMessage(error?.message)
      this.snackBar.open(errorMessage, "ok", {
        panelClass: ['snackbar-error']
      })
    } finally {
      this.loading = false
      console.log(this.loading)

    }
  }

  getFirebaseErrorMessage(errorCode: string): string {
    const errorMap: { [key: string]: string } = {
      'Firebase: Error (auth/user-not-found).': 'No user found with this email.',
      'Firebase: Error (auth/invalid-credential).': 'Incorrect Email or Password. Please try again.',
      'Firebase: Error (auth/invalid-email).': 'Invalid email format.',
      'Firebase: Error (auth/user-disabled).': 'This account has been disabled.',
      'Firebase: Error (auth/too-many-requests).': 'Too many login attempts. Please try again later.',
      'Firebase: Error (auth/network-request-failed).': 'Network error. Check your internet connection.',
    };

    return errorMap[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  formValid() {
    const isValid = this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid
    return isValid;
  }

  handleEyeClick() {
    this.showPs = !this.showPs
    if (this.showPs == true) {
      this.passwordInput.nativeElement.type = "text"
    } else {
      this.passwordInput.nativeElement.type = "password"
    }
  }
}
