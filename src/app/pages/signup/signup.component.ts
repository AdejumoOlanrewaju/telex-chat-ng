import { Component, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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


  protected nameControl = new FormControl('', [Validators.required])
  protected emailControl = new FormControl('', [Validators.required, Validators.email])
  protected passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)])

  async signup() {
    try {
      const email = this.emailControl.value!;
      const password = this.passwordControl.value!

      await createUserWithEmailAndPassword(this.auth, email, password)
      this.router.navigate(['/login'])
    } catch (err) {
      throw (err)
    }

  }

  formValid() {
    return this.nameControl.valid && this.emailControl.valid && this.passwordControl.valid;
  }
}
