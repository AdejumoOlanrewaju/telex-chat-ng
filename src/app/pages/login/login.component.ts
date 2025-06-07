import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor() { }
  showPs: boolean = false
  @ViewChild('passwordInput') passwordInput !: ElementRef;

  private auth = inject(Auth)
  private router = inject(Router)
  private authService = inject(AuthService)
  private snackBar = inject(MatSnackBar)

  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])

  login() {
    if(this.formValid()){
      this.authService.login(this.emailControl, this.passwordControl)
    }
  }

  formValid() {
    const isValid = this.emailControl.valid && this.passwordControl.valid;
    if (isValid) {
      this.snackBar.open("Form completed successfully", "Dismiss", {
        duration: 9000,
        panelClass: ['snackbar-success']
      })
    } else {
      this.snackBar.open("Error occurred, pls fill all fields correctly", "ok", {
        panelClass: ['snackbar-error']
      })
    }
    return this.emailControl.valid && this.passwordControl.valid;
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
