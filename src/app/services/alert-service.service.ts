import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar"

@Injectable({
  providedIn: 'root'
})
export class AlertServiceService {
  private snackBar = inject(MatSnackBar)

  constructor() { }

  showSuccess(message: string, duration: number = 3000) {
    this.snackBar.open(message, 'Ok', {
      duration,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showError(message: string, duration: number = 5000) {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showInfo(message: string, duration: number = 7000) {
    this.snackBar.open(message, '', {
      duration,
      panelClass: ['snackbar-info'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
