import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertServiceService } from '../../services/alert-service.service';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  // Email form control with validation
  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  // Inject required services
  private alertService = inject(AlertServiceService)
  private auth = inject(Auth)
  router = inject(Router)
  // Loading state for button spinner or disabling input
  public loading: boolean = false
  constructor() { }

  /**
   * Handles sending a password reset email
   */
  async forgotPassword() {
    const email = this.emailControl.value?.trim()
    // Validate email field before sending request
    if (!email || !this.emailControl.valid) {
      this.alertService.showError("Pls enter a valid email", 5000)
      return
    }

    try {
      this.loading = true

      // Send password reset email through Firebase Auth
      await sendPasswordResetEmail(this.auth, email)
      this.alertService.showSuccess("Password reset link sent. Check your email", 6000)
    } catch (err : any) {
      console.error(err);
      const errorMsg = this.getFirebaseErrorMessage(err?.message)
      this.alertService.showError(errorMsg, 6000)
    } finally {
      this.loading = false
    }
  }

    /**
   * Maps Firebase error codes to human-readable error messages.
   */
  getFirebaseErrorMessage(errorCode: string): string {
    const errorMap: { [key: string]: string } = {
      'Firebase: Error (auth/user-not-found).': 'No user found with this email.',
      'Firebase: Error (auth/invalid-credential).': 'Incorrect Email or Password. Please try again.',
      'Firebase: Error (auth/invalid-email).': 'Invalid email format.',
      'Firebase: Error (auth/user-disabled).': 'This account has been disabled.',
      'Firebase: Error (auth/email-already-in-use).' : "Email already exists",
      'Firebase: Error (auth/too-many-requests).': 'Too many login attempts. Please try again later.',
      'Firebase: Error (auth/network-request-failed).': 'Network error. Check your internet connection.',
    };

    return errorMap[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  goToLogin(){
   this.router.navigate(['/login']) 
  }
}
