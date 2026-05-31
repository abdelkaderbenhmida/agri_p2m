import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Product, ProductCategory } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

// Interface étendue pour inclure la distance calculée
interface ProductWithDistance extends Product {
  calculatedDistance?: number;
}

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent, PaginationComponent, SkeletonComponent],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.css'
})
export class MarketplaceComponent implements OnInit {
  products: ProductWithDistance[] = [];
  filteredProducts: ProductWithDistance[] = [];
  paginatedProducts: ProductWithDistance[] = [];
  loading = true;
  loadingDistances = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  
  // Search & Sort
  searchQuery = '';
  selectedCategory = 'all';
  sortBy = 'distance';
  
  // Filters
  maxDistance = 500;
  minPrice = 0;
  maxPrice = 1000;
  filters = {
    bio: false,
    seasonal: false,
    harvestedToday: false,
    permaculture: false
  };

  categories = [
    { value: 'all', label: 'Toutes catégories', icon: '🛒' },
    { value: 'fruits', label: 'Fruits', icon: '🍎' },
    { value: 'légumes', label: 'Légumes', icon: '🥬' },
    { value: 'bio', label: 'Bio', icon: '🌱' },
    { value: 'permaculture', label: 'Permaculture', icon: '♻️' }
  ];

  sortOptions = [
    { value: 'distance', label: 'Plus proche' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'rating', label: 'Mieux notés' }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private toastService: ToastService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.products = products as ProductWithDistance[];
        this.calculateDistances();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  calculateDistances(): void {
    this.loadingDistances = true;
    
    // Extraire toutes les locations uniques des produits
    const locations = [...new Set(this.products.map(p => p.location))];
    
    // Calculer les distances pour toutes les locations
    this.geolocationService.calculateDistancesFromUser(locations).subscribe({
      next: (distanceMap) => {
        // Assigner les distances calculées aux produits
        this.products.forEach(product => {
          const distance = distanceMap.get(product.location);
          product.calculatedDistance = distance !== undefined ? distance : 999;
        });
        
        this.loadingDistances = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error calculating distances:', error);
        // En cas d'erreur, assigner des distances par défaut
        this.products.forEach(product => {
          product.calculatedDistance = 500; // Distance par défaut (toute la Tunisie)
        });
        this.loadingDistances = false;
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Search filter
    if (this.searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        if (this.selectedCategory === 'bio') return p.isOrganic;
        return p.category.toLowerCase() === this.selectedCategory;
      });
    }

    // Custom filters
    if (this.filters.bio) {
      filtered = filtered.filter(p => p.isOrganic);
    }

    if (this.filters.seasonal) {
      filtered = filtered.filter(p => p.isAvailable);
    }

    // Price range filter
    filtered = filtered.filter(p => p.price >= this.minPrice && p.price <= this.maxPrice);

    // Distance filter — products without location are always shown
    filtered = filtered.filter(p => {
      if (!p.location) return true;
      const distance = p.calculatedDistance !== undefined ? p.calculatedDistance : 999;
      return distance <= this.maxDistance;
    });

    // Sort
    this.sortProducts(filtered);
    
    this.filteredProducts = filtered;
    this.currentPage = 1; // Reset to first page on filter change
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sortProducts(products: ProductWithDistance[]): void {
    switch (this.sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
      default:
        // Trier par distance calculée
        products.sort((a, b) => {
          const distA = a.calculatedDistance !== undefined ? a.calculatedDistance : 999;
          const distB = b.calculatedDistance !== undefined ? b.calculatedDistance : 999;
          return distA - distB;
        });
        break;
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onDistanceChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = {
      bio: false,
      seasonal: false,
      harvestedToday: false,
      permaculture: false
    };
    this.maxDistance = 500;
    this.minPrice = 0;
    this.maxPrice = 1000;
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    this.toastService.success(`${product.name} ajouté au panier`);
  }

  viewProductDetails(product: Product): void {
    // Navigate to product details
    console.log('View product:', product);
  }
}
