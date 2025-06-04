import { Component, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  constructor() { }
  private auth = inject(Auth)
  private router = inject(Router)
  private authService = inject(AuthService)
  private chatService = inject(ChatService)


  protected nameControl = new FormControl('', [Validators.required])
  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])
  protected profilePicControl = new FormControl('')

  async signup() {
    this.authService.signup(this.emailControl, this.passwordControl, this.nameControl,
this.profilePicControl )

  }

  formValid() {
    return this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid;
  }
}
