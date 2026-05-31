import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './auth.component.css'
})
export class ForgotPasswordComponent {

  step = 1; // 1=email, 2=code, 3=nouveau mot de passe

  email = '';
  codeDigits = ['', '', '', '', '', ''];
  code = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = false;
  showPassword = false;
  showConfirmPassword = false;
  resendCountdown = 0;
  receivedCode = ''; // Code affiché directement à l'écran

  constructor(private http: HttpClient) {}

  private normalizeEmail(value: string): string {
    return (value || '').replace(/^mailto:/i, '').trim().toLowerCase();
  }

  sendCode(): void {
    this.email = this.normalizeEmail(this.email);

    if (!this.email || this.email.trim().length < 3) {
      this.error = 'Veuillez entrer votre email ou numero de telephone';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.receivedCode = res.code || '';
        // Remplir automatiquement les cases avec le code
        if (this.receivedCode) {
          this.codeDigits = this.receivedCode.split('');
          this.code = this.receivedCode;
        }
        this.step = 2;
        this.startResendCountdown();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Aucun compte trouve avec cet email.';
      }
    });
  }

  verifyCode(): void {
    this.email = this.normalizeEmail(this.email);
    this.code = this.codeDigits.join('');
    if (this.code.length !== 6) {
      this.error = 'Veuillez entrer le code a 6 chiffres recu par email';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http.post(`${environment.apiUrl}/auth/verify-reset-code`, { email: this.email, code: this.code }).subscribe({
      next: () => {
        this.loading = false;
        this.step = 3;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Code incorrect ou expire.';
      }
    });
  }

  resetPassword(): void {
    this.email = this.normalizeEmail(this.email);

    if (this.newPassword.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caracteres';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      email: this.email,
      code: this.code,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors de la reinitialisation.';
      }
    });
  }

  onDigitInput(index: number, event: any): void {
    const value = event.target.value.replace(/\D/g, '');
    this.codeDigits[index] = value ? value[0] : '';
    if (value && index < 5) {
      document.getElementById('digit-' + (index + 1))?.focus();
    }
    this.code = this.codeDigits.join('');
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      document.getElementById('digit-' + (index - 1))?.focus();
    }
  }

  onDigitPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '') || '';
    if (pasted.length === 6) {
      this.codeDigits = pasted.split('');
      this.code = pasted;
      event.preventDefault();
    }
  }

  resendCode(): void {
    this.codeDigits = ['', '', '', '', '', ''];
    this.code = '';
    this.receivedCode = '';
    this.error = '';
    this.sendCode();
  }

  startResendCountdown(): void {
    this.resendCountdown = 60;
    const interval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) clearInterval(interval);
    }, 1000);
  }

  get passwordStrength(): number {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'Faible';
    if (s <= 3) return 'Moyen';
    return 'Fort';
  }

  get passwordStrengthColor(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'bg-red-500';
    if (s <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}