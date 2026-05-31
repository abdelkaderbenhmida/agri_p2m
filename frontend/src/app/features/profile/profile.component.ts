import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  editMode = false;
  loading = false;
  selectedPhoto: string | null = null;
  photoUploading = false;
  
  // Form data
  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    farmName: '',
    farmDescription: '',
    farmSize: 0
  };

  // Password change
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  showPasswordForm = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.populateForm();
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  populateForm() {
    if (this.user) {
      this.profileForm = {
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        address: typeof this.user.address === 'string' ? this.user.address : this.user.address?.street || '',
        city: typeof this.user.address === 'object' ? this.user.address?.city || '' : '',
        postalCode: typeof this.user.address === 'object' ? this.user.address?.zipCode || '' : '',
        farmName: this.user.farmerProfile?.farmName || '',
        farmDescription: this.user.farmerProfile?.description || '',
        farmSize: 0
      };
    }
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.populateForm(); // Reset form if cancelled
    }
  }

  saveProfile() {
    this.loading = true;
    
    if (this.user) {
      const updateData = {
        firstName: this.profileForm.firstName,
        lastName: this.profileForm.lastName,
        phone: this.profileForm.phone,
        address: {
          street: this.profileForm.address,
          city: this.profileForm.city,
          state: '',
          zipCode: this.profileForm.postalCode,
          country: 'Tunisia'
        },
        ...(this.user.role === 'FARMER' && {
          farmerProfile: {
            farmName: this.profileForm.farmName,
            description: this.profileForm.farmDescription,
            rating: this.user.farmerProfile?.rating || 0,
            totalReviews: this.user.farmerProfile?.totalReviews || 0,
            specialties: this.user.farmerProfile?.specialties || []
          }
        })
      };
      
      this.authService.updateProfile(updateData).subscribe({
        next: () => {
          this.toastService.success('Profil mis à jour avec succès!');
          this.editMode = false;
          this.loading = false;
        },
        error: (error) => {
          this.toastService.error('Erreur lors de la mise à jour du profil');
          this.loading = false;
        }
      });
    }
  }

  changePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.loading = true;
    
    const passwordData = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };
    
    this.authService.changePassword(passwordData).subscribe({
      next: () => {
        this.toastService.success('Mot de passe changé avec succès!');
        this.showPasswordForm = false;
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error('Erreur: vérifiez votre mot de passe actuel');
        this.loading = false;
      }
    });
  }

  isFarmer(): boolean {
    return this.user?.role === 'FARMER';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('Image trop grande. Maximum 10 Mo.');
      input.value = '';
      return;
    }

    this.photoUploading = true;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 800;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);

      this.selectedPhoto = base64;
      input.value = '';

      this.authService.updateProfile({ profileImage: base64 }).subscribe({
        next: () => {
          this.photoUploading = false;
          this.toastService.success('Photo de profil mise à jour !');
        },
        error: () => {
          this.photoUploading = false;
          this.selectedPhoto = null;
          this.toastService.error('Erreur lors du téléchargement de la photo');
        }
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.photoUploading = false;
      this.toastService.error('Impossible de lire cette image.');
      input.value = '';
    };

    img.src = objectUrl;
  }
}
