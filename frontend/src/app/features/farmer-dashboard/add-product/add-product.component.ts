import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ImageUploadComponent],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit {
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  
  product: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    unit: 'kg',
    category: undefined,
    images: [],
    isOrganic: false,
    isAvailable: true,
    location: ''
  };

  tunisianCities = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Cap Bon',
    'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana',
    'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine',
    'Sidi Bouzid', 'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];

  categories = [
    { value: 'FRUITS', label: '🍎 Fruits' },
    { value: 'VEGETABLES', label: '🥕 Légumes' },
    { value: 'DAIRY', label: '🥛 Produits laitiers' },
    { value: 'MEAT', label: '🍖 Viandes' },
    { value: 'GRAINS', label: '🌾 Céréales' },
    { value: 'HERBS', label: '🌿 Herbes & Épices' },
    { value: 'EGGS', label: '🥚 Œufs' },
    { value: 'HONEY', label: '🍯 Miel & Confiseries' }
  ];

  units = [
    { value: 'kg', label: 'Kilogramme (kg)' },
    { value: 'g', label: 'Gramme (g)' },
    { value: 'l', label: 'Litre (l)' },
    { value: 'piece', label: 'Pièce' },
    { value: 'bunch', label: 'Botte' },
    { value: 'dozen', label: 'Douzaine' }
  ];

  imageUrls: string[] = [];
  newImageUrl = '';

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = { ...product };
        this.imageUrls = product.images || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product', error);
        this.toastService.error('Erreur lors du chargement du produit');
        this.loading = false;
        this.router.navigate(['/farmer-dashboard']);
      }
    });
  }

  addImageUrl(): void {
    if (this.newImageUrl.trim()) {
      this.imageUrls.push(this.newImageUrl.trim());
      this.product.images = [...this.imageUrls];
      this.newImageUrl = '';
    }
  }

  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
    this.product.images = [...this.imageUrls];
  }

  onImagesChange(images: string[]): void {
    this.imageUrls = images;
    this.product.images = images;
  }

  onSubmit(): void {
    // Validation
    if (!this.product.name || !this.product.description || !this.product.category ||
        this.product.price === undefined || this.product.price === null ||
        this.product.stock === undefined || this.product.stock === null) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.product.price <= 0) {
      this.toastService.warning('Le prix doit être supérieur à 0');
      return;
    }

    if (this.product.stock < 0) {
      this.toastService.warning('Le stock ne peut pas être négatif');
      return;
    }

    this.loading = true;
    this.product.images = this.imageUrls; this.product.farmerId = this.authService.getCurrentUser()?.id;

    if (this.isEditMode && this.productId) {
      // Update existing product
      this.productService.updateProduct(this.productId, this.product as Product).subscribe({
        next: () => {
          this.toastService.success('Produit modifié avec succès !');
          this.router.navigate(['/farmer-dashboard']);
        },
        error: (error) => {
          console.error('Error updating product', error);
          this.toastService.error('Erreur lors de la modification du produit');
          this.loading = false;
        }
      });
    } else {
      // Create new product
      this.productService.createProduct(this.product as Product).subscribe({
        next: () => {
          this.toastService.success('Produit ajouté avec succès !');
          this.router.navigate(['/farmer-dashboard']);
        },
        error: (error) => {
          console.error('Error creating product', error);
          const msg = error?.error?.message || error?.message || 'Erreur inconnue';
          this.toastService.error(`Erreur lors de l'ajout du produit: ${msg}`);
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.')) {
      this.router.navigate(['/farmer-dashboard']);
    }
  }
}
