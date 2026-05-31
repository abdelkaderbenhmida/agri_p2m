import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div *ngFor="let toast of toasts" 
           [ngClass]="getToastClasses(toast)"
           class="min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in">
        <span class="text-xl">{{ getIcon(toast.type) }}</span>
        <div class="flex-1">
          <p class="font-medium">{{ toast.message }}</p>
        </div>
        <button (click)="close(toast.id)" class="text-xl opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getToastClasses(toast: Toast): string {
    const baseClasses = 'border-l-4 ';
    switch (toast.type) {
      case 'success':
        return baseClasses + 'bg-green-50 border-green-500 text-green-900';
      case 'error':
        return baseClasses + 'bg-red-50 border-red-500 text-red-900';
      case 'warning':
        return baseClasses + 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'info':
        return baseClasses + 'bg-blue-50 border-blue-500 text-blue-900';
      default:
        return baseClasses + 'bg-gray-50 border-gray-500 text-gray-900';
    }
  }

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }

  close(id: number) {
    this.toastService.removeToast(id);
  }
}
