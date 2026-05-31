import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() compact: boolean = false;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() addToFavorites = new EventEmitter<Product>();

  isHovered: boolean = false;
  isFavorite: boolean = false;

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isFavorite = !this.isFavorite;
    this.addToFavorites.emit(this.product);
  }

  getImageUrl(): string {
    return this.product.images && this.product.images.length > 0 
      ? this.product.images[0] 
      : 'assets/images/placeholder-product.jpg';
  }

  getRatingStars(): number[] {
    const rating = this.product.rating || 0;
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getBadgeClass(badge: string): string {
    const badgeMap: {[key: string]: string} = {
      'bio': 'bg-green-100 text-green-700',
      'seasonal': 'bg-orange-100 text-orange-700',
      'fresh': 'bg-blue-100 text-blue-700',
      'permaculture': 'bg-emerald-100 text-emerald-700',
      'harvested-today': 'bg-red-100 text-red-700'
    };
    return badgeMap[badge] || 'bg-gray-100 text-gray-700';
  }

  getAvailabilityClass(): string {
    if (!this.product.isAvailable || this.product.stock === 0) {
      return 'text-red-600';
    }
    if (this.product.stock < 10) {
      return 'text-orange-600';
    }
    return 'text-green-600';
  }

  getAvailabilityText(): string {
    if (!this.product.isAvailable || this.product.stock === 0) {
      return 'Rupture de stock';
    }
    if (this.product.stock < 10) {
      return `Plus que ${this.product.stock} disponible${this.product.stock > 1 ? 's' : ''}`;
    }
    return 'En stock';
  }
}
