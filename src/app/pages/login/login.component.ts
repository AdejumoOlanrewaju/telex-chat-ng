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
  loading: boolean = false
  @ViewChild('passwordInput') passwordInput !: ElementRef;

  private auth = inject(Auth)
  private router = inject(Router)
  private authService = inject(AuthService)
  private snackBar = inject(MatSnackBar)

  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])

  login() {
    try {
      this.loading = true
      if (this.formValid()) {
        this.authService.login(this.emailControl.value, this.passwordControl.value).then(() => {
          this.snackBar.open("Form submitted successfully", "Dismiss", {
            duration: 9000,
            panelClass: ['snackbar-success']
          })
        });
      }
    } catch (error: any) {
      console.log(error)
      this.snackBar.open(error, "ok", {
        panelClass: ['snackbar-error']
      })
    } finally {
      this.loading = false
    }
  }

  formValid() {
    const isValid = this.emailControl.valid && this.passwordControl.valid;
    if (isValid) {
      this.snackBar.open("Form completed successfully", "Dismiss", {
        duration: 9000,
        panelClass: ['snackbar-success']
      })
    }else{
      this.snackBar.open("Pls fill all the fields", "ok", {
        panelClass: ['snackbar-error']
      })
    }
    return isValid
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
