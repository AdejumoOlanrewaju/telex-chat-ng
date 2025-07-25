import { Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertServiceService } from '../../services/alert-service.service';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';

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
    } catch (err) {
      console.error(err);
      this.alertService.showError("Error sending reset link. Please try again.", 6000)
    } finally {
      this.loading = false
    }
  }
}
