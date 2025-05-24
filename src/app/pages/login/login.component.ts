import { Component, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor() { }
  private auth = inject(Auth)
  private router = inject(Router)


  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])

  async login() {
    try {
      const email = this.emailControl.value!;
      const password = this.passwordControl.value!

      await signInWithEmailAndPassword(this.auth, email, password)
      this.router.navigate(['/chat'])
    } catch (err) {
      throw (err)
    }

  }

  formValid() {
    return this.emailControl.valid && this.passwordControl.valid;
  }

}
