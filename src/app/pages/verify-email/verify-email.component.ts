import { Component, inject } from '@angular/core';
import { Auth, sendEmailVerification } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AlertServiceService } from '../../services/alert-service.service';

@Component({
  selector: 'app-verify-email',
  imports: [],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent {
  auth = inject(Auth)
  router = inject(Router)
  alertService = inject(AlertServiceService)
  loading : boolean = false
  constructor(){}

  async resendVerificationEmail() {
    try{
      this.loading = true
      const user = this.auth.currentUser;
      console.log(this.auth);
      console.log(user?.emailVerified);
      if (user && !user.emailVerified) {
        
        await sendEmailVerification(user);
        console.log(await sendEmailVerification(user));
        
        this.alertService.showInfo('Verification email sent.', 4000)
      }

    }catch(err){
      console.error(err)
    }finally{
      this.loading = false
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
