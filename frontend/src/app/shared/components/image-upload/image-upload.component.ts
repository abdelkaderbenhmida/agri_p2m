import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Upload Area -->
      <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
           (click)="fileInput.click()"
           (dragover)="onDragOver($event)"
           (drop)="onDrop($event)">
        <input #fileInput type="file" multiple accept="image/*" class="hidden" (change)="onFileSelect($event)">
        <div class="text-4xl mb-4">📸</div>
        <div class="text-gray-700 font-medium mb-2">
          Cliquez pour choisir des images ou glissez-les ici
        </div>
        <div class="text-sm text-gray-500">
          PNG, JPG, JPEG (max 5MB par image)
        </div>
      </div>

      <!-- Image Previews -->
      <div *ngIf="previewImages.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div *ngFor="let preview of previewImages; let i = index" class="relative group">
          <div class="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img [src]="preview.url" [alt]="preview.name" class="w-full h-full object-cover">
          </div>
          <button (click)="removeImage(i)" 
                  class="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-xl leading-none">×</span>
          </button>
          <div class="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate">
            {{ preview.name }}
          </div>
        </div>
      </div>

      <!-- URL Input Option -->
      <div class="border-t pt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Ou ajouter une URL d'image</label>
        <div class="flex gap-2">
          <input [(ngModel)]="imageUrl" 
                 type="url" 
                 placeholder="https://example.com/image.jpg"
                 class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
          <button (click)="addUrlImage()" 
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ImageUploadComponent {
  @Input() images: string[] = [];
  @Output() imagesChange = new EventEmitter<string[]>();
  
  previewImages: { url: string; name: string; file?: File }[] = [];
  imageUrl = '';

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    // Load existing images
    this.images.forEach(url => {
      this.previewImages.push({ url, name: this.getFileNameFromUrl(url) });
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  handleFiles(files: File[]): void {
    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.error(`${file.name} n'est pas une image valide`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error(`${file.name} est trop volumineux (max 5MB)`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push({
          url: e.target.result,
          name: file.name,
          file: file
        });
        this.updateImages();
      };
      reader.readAsDataURL(file);
    });
  }

  addUrlImage(): void {
    if (!this.imageUrl) {
      this.toastService.warning('Veuillez entrer une URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(this.imageUrl);
      this.previewImages.push({
        url: this.imageUrl,
        name: this.getFileNameFromUrl(this.imageUrl)
      });
      this.updateImages();
      this.imageUrl = '';
    } catch {
      this.toastService.error('URL invalide');
    }
  }

  removeImage(index: number): void {
    this.previewImages.splice(index, 1);
    this.updateImages();
  }

  updateImages(): void {
    // For now, we emit URLs. In production, you'd upload files to server first
    const imageUrls = this.previewImages.map(img => img.url);
    this.imagesChange.emit(imageUrls);
  }

  getFileNameFromUrl(url: string): string {
    try {
      return url.split('/').pop() || 'image';
    } catch {
      return 'image';
    }
  }
}
