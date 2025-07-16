import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { AlertServiceService } from '../../services/alert-service.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  // Toggle for showing or hiding password input
  showPs: boolean = false;

  // State for showing loading spinner or disabling buttons
  loading: boolean = false;

  // Access to the password input field in the template
  @ViewChild('passwordInput') passwordInput!: ElementRef;

  // Injecting Firebase Auth instance
  private auth = inject(Auth);

  // Angular Router for navigation after login
  private router = inject(Router);

  // Custom auth service to handle login logic
  private authService = inject(AuthService);

  // Service to show alerts/snackbars
  private alertService = inject(AlertServiceService);

  // Angular Material snackbar for showing error messages
  private snackBar = inject(MatSnackBar);

  // Email input control with validation
  protected emailControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);

  // Password input control with validation
  protected passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6)
  ]);

  constructor() {
    // Optional: Force refresh of current user's auth state every 1.5 seconds
    const user = this.auth.currentUser;
    setInterval(() => {
      user?.reload();
    }, 1500);
  }

  /**
   * Attempts to log the user in using the email and password fields.
   */
  async login() {
    try {
      this.loading = true;

      // Ensure form is valid before submitting
      if (this.formValid()) {
        await this.authService.login(this.emailControl.value, this.passwordControl.value);
      }
    } catch (error: any) {
      console.log(error?.message);

      // Show user-friendly error message
      const errorMessage = this.getFirebaseErrorMessage(error?.message);
      this.snackBar.open(errorMessage, "ok", {
        duration: 6000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.loading = false;
    }
  }

  /**
   * Maps Firebase error messages to user-friendly versions.
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

    return errorMap[errorCode] || 'An unknown error occurred.';
  }

  /**
   * Checks if the login form is valid.
   */
  formValid(): boolean {
    return this.emailControl.valid && this.passwordControl.valid;
  }

  /**
   * Toggles password visibility on input field.
   */
  handleEyeClick() {
    this.showPs = !this.showPs;
    this.passwordInput.nativeElement.type = this.showPs ? "text" : "password";
  }
}
