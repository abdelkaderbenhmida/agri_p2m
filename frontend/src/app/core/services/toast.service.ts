import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private toastId = 0;

  success(message: string, duration: number = 3000) {
    this.showToast('success', message, duration);
  }

  error(message: string, duration: number = 5000) {
    this.showToast('error', message, duration);
  }

  info(message: string, duration: number = 3000) {
    this.showToast('info', message, duration);
  }

  warning(message: string, duration: number = 4000) {
    this.showToast('warning', message, duration);
  }

  private showToast(type: Toast['type'], message: string, duration: number) {
    const toast: Toast = {
      id: this.toastId++,
      type,
      message,
      duration
    };

    const currentToasts = this.toastsSubject.getValue();
    this.toastsSubject.next([...currentToasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }
  }

  removeToast(id: number) {
    const currentToasts = this.toastsSubject.getValue();
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }
}
