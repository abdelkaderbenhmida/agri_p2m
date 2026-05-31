import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  selectedImageIndex = 0;
  quantity = 1;
  
  // Review form
  showReviewForm = false;
  reviewForm = {
    rating: 5,
    comment: ''
  };
  submittingReview = false;

  relatedProducts: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
      this.loadRelatedProducts();
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product', error);
        this.loading = false;
      }
    });
  }

  loadRelatedProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.relatedProducts = products.slice(0, 3);
      },
      error: (error) => {
        console.error('Error loading related products', error);
      }
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.toastService.success(`${this.quantity} ${this.product.name} ajouté(s) au panier !`);
    }
  }

  buyNow(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.router.navigate(['/cart']);
    }
  }

  contactFarmer(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.error('Connectez-vous pour contacter le fermier');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.product || !this.product.farmer) {
      this.toastService.error('Informations du fermier non disponibles');
      return;
    }

    const farmer = this.product.farmer;
    const farmerName = farmer.firstName && farmer.lastName 
      ? `${farmer.firstName} ${farmer.lastName}` 
      : farmer.email || 'Fermier';

    // Create or navigate to conversation with the farmer
    this.messageService.createConversation(
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      farmer.id,
      farmerName,
      this.product.id,
      this.product.name
    ).subscribe({
      next: () => {
        this.router.navigate(['/messages']);
        this.toastService.success('Redirection vers la messagerie');
      },
      error: () => {
        this.toastService.error('Erreur lors de la création de la conversation');
      }
    });
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '⭐' : '☆');
    }
    return stars;
  }

  openReviewForm(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.warning('Vous devez être connecté pour laisser un avis');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.showReviewForm = true;
  }

  closeReviewForm(): void {
    this.showReviewForm = false;
    this.reviewForm = { rating: 5, comment: '' };
  }

  selectRating(rating: number): void {
    this.reviewForm.rating = rating;
  }

  submitReview(): void {
    if (!this.product) return;
    
    if (!this.reviewForm.comment.trim()) {
      this.toastService.error('Veuillez écrire un commentaire');
      return;
    }

    this.submittingReview = true;
    
    this.productService.addReview(
      this.product.id,
      this.reviewForm.rating,
      this.reviewForm.comment
    ).subscribe({
      next: () => {
        this.toastService.success('Merci pour votre avis !');
        this.closeReviewForm();
        this.submittingReview = false;
        // Reload product to get updated reviews
        if (this.product) {
          this.loadProduct(this.product.id);
        }
      },
      error: (error) => {
        this.toastService.error('Erreur lors de l\'envoi de votre avis');
        this.submittingReview = false;
      }
    });
  }
}
