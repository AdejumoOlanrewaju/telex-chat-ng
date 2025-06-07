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
    if(this.formValid()){
      this.authService.signup(this.emailControl, this.passwordControl, this.nameControl,
        this.profilePicControl)
    }
  }

  formValid() {
    const isValid = this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid
    if(isValid){
      this.snackBar.open("Form completed successfully", "Dismiss", {
        duration : 9000,
        panelClass : ['snackbar-success']
      })
    }else{
      this.snackBar.open("Error occurred, pls fill all fields correctly", "ok", {
        panelClass : ['snackbar-error']
      })
    }
    return this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid;
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
