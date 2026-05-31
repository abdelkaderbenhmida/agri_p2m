import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      <!-- Card Skeleton -->
      <div *ngIf="type === 'card'" class="skeleton-card">
        <div class="skeleton-image shimmer"></div>
        <div class="skeleton-content">
          <div class="skeleton-line shimmer" style="width: 70%;"></div>
          <div class="skeleton-line shimmer" style="width: 90%;"></div>
          <div class="skeleton-line shimmer" style="width: 60%;"></div>
          <div class="skeleton-line shimmer" style="width: 40%;"></div>
        </div>
      </div>

      <!-- List Item Skeleton -->
      <div *ngIf="type === 'list'" class="skeleton-list-item">
        <div class="skeleton-avatar shimmer"></div>
        <div class="skeleton-content">
          <div class="skeleton-line shimmer" style="width: 80%;"></div>
          <div class="skeleton-line shimmer" style="width: 60%;"></div>
        </div>
      </div>

      <!-- Text Skeleton -->
      <div *ngIf="type === 'text'" class="skeleton-text">
        <div class="skeleton-line shimmer" [style.width]="width"></div>
      </div>

      <!-- Circle Skeleton -->
      <div *ngIf="type === 'circle'" class="skeleton-circle shimmer" [style.width.px]="size" [style.height.px]="size"></div>

      <!-- Rectangle Skeleton -->
      <div *ngIf="type === 'rectangle'" class="skeleton-rectangle shimmer" [style.width]="width" [style.height]="height"></div>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
    }

    /* Card Skeleton */
    .skeleton-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .skeleton-image {
      width: 100%;
      height: 200px;
      background: #e0e0e0;
    }

    .skeleton-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* List Item Skeleton */
    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #e0e0e0;
      flex-shrink: 0;
    }

    /* Line */
    .skeleton-line {
      height: 16px;
      background: #e0e0e0;
      border-radius: 4px;
    }

    /* Circle */
    .skeleton-circle {
      border-radius: 50%;
      background: #e0e0e0;
    }

    /* Rectangle */
    .skeleton-rectangle {
      background: #e0e0e0;
      border-radius: 8px;
    }

    /* Shimmer Animation */
    @keyframes shimmer {
      0% {
        background-position: -468px 0;
      }
      100% {
        background-position: 468px 0;
      }
    }

    .shimmer {
      animation: shimmer 1.5s infinite linear;
      background: linear-gradient(
        to right,
        #e0e0e0 0%,
        #f0f0f0 20%,
        #e0e0e0 40%,
        #e0e0e0 100%
      );
      background-size: 800px 100%;
    }

    /* Text Skeleton */
    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'card' | 'list' | 'text' | 'circle' | 'rectangle' = 'card';
  @Input() width: string = '100%';
  @Input() height: string = '100px';
  @Input() size: number = 48;
  @Input() count: number = 1;
}
