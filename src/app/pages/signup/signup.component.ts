import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Auth } from '@angular/fire/auth';
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

  // Controls password visibility
  showPs: boolean = false;

  // Loading state  showing spinner
  loading: boolean = false;

  // Reference to password input DOM element
  @ViewChild('passwordInput') passwordInput!: ElementRef;

  // Custom auth service to create and verify users
  private authService = inject(AuthService);

  // Angular Material snackbar for feedback messages
  private snackBar = inject(MatSnackBar);

  // Form controls for signup fields with validation
  protected nameControl = new FormControl('', [Validators.required]);
  protected emailControl = new FormControl('', [Validators.required, Validators.email]);
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  protected profilePicControl = new FormControl(''); // Optional profile picture URL

  constructor() { }

  /**
   * Handles the signup button click.
   * Uses custom authService to register a new user and handles error feedback.
   */
  async signup() {
    try {
      this.loading = true;

      if (this.formValid()) {
        await this.authService.signup(
          this.emailControl,
          this.passwordControl,
          this.nameControl,
          this.profilePicControl
        );
      }
    } catch (error: any) {
      console.log(error);

      const errorMessage = this.getFirebaseErrorMessage(error?.message);
      this.snackBar.open(errorMessage, "ok", {
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading = false;
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
      'Firebase: Error (auth/too-many-requests).': 'Too many login attempts. Please try again later.',
      'Firebase: Error (auth/network-request-failed).': 'Network error. Check your internet connection.',
    };

    return errorMap[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Validates the signup form.
   */
  formValid(): boolean {
    return this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid;
  }

  /**
   * Toggles visibility of the password input field.
   */
  handleEyeClick() {
    this.showPs = !this.showPs;
    this.passwordInput.nativeElement.type = this.showPs ? "text" : "password";
  }


}
