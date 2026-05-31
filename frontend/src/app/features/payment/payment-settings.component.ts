import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentMethod, PaymentType } from '../../core/models/payment.model';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Paramètres de Paiement</h1>

        <!-- Stripe Info Banner -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-start">
            <i class="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
            <div>
              <h3 class="font-semibold text-blue-900">Paiements sécurisés avec Stripe</h3>
              <p class="text-sm text-blue-700 mt-1">
                Vos informations de paiement sont sécurisées et cryptées. Nous utilisons Stripe pour traiter tous les paiements.
              </p>
              <p class="text-xs text-blue-600 mt-2">
                Note: Configuration Stripe requise dans le backend (clés API dans application.properties)
              </p>
            </div>
          </div>
        </div>

        <!-- Payment Methods List -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Mes méthodes de paiement</h2>
            <button (click)="showAddForm = !showAddForm"
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <i class="fas fa-plus mr-2"></i>Ajouter
            </button>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p class="mt-2 text-gray-600">Chargement...</p>
          </div>

          <!-- Payment Methods -->
          <div *ngIf="!loading && paymentMethods.length > 0" class="space-y-4">
            <div *ngFor="let method of paymentMethods" 
                 class="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                  <i class="fas fa-credit-card text-gray-600 text-xl"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900">
                      {{formatPaymentType(method.type)}}
                    </h3>
                    <span *ngIf="method.isDefault" 
                          class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Par défaut
                    </span>
                  </div>
                  <p class="text-gray-600 text-sm" *ngIf="method.cardLast4">
                    {{method.cardBrand | uppercase}} •••• {{method.cardLast4}}
                    <span *ngIf="method.cardExpMonth && method.cardExpYear">
                      - Expire {{method.cardExpMonth}}/{{method.cardExpYear}}
                    </span>
                  </p>
                  <p class="text-gray-600 text-sm" *ngIf="method.bankName">
                    {{method.bankName}} •••• {{method.accountLast4}}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <button *ngIf="!method.isDefault" 
                        (click)="setDefault(method.id!)"
                        class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  Définir par défaut
                </button>
                <button (click)="deleteMethod(method.id!)"
                        class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading && paymentMethods.length === 0" class="text-center py-8">
            <i class="fas fa-credit-card text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucune méthode de paiement</h3>
            <p class="text-gray-600">Ajoutez une méthode de paiement pour faciliter vos achats.</p>
          </div>
        </div>

        <!-- Add Payment Method Form -->
        <div *ngIf="showAddForm" class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Ajouter une méthode de paiement</h2>
          
          <form (ngSubmit)="addPaymentMethod()" class="space-y-4">
            <!-- Payment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type de paiement</label>
              <select [(ngModel)]="newMethod.type" name="type" required
                      class="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="">Sélectionner...</option>
                <option value="CREDIT_CARD">Carte de crédit</option>
                <option value="DEBIT_CARD">Carte de débit</option>
                <option value="BANK_ACCOUNT">Compte bancaire</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CASH_ON_DELIVERY">Paiement à la livraison</option>
              </select>
            </div>

            <!-- Card Details (if card selected) -->
            <div *ngIf="newMethod.type === 'CREDIT_CARD' || newMethod.type === 'DEBIT_CARD'">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Marque</label>
                  <select [(ngModel)]="newMethod.cardBrand" name="cardBrand"
                          class="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">4 derniers chiffres</label>
                  <input type="text" [(ngModel)]="newMethod.cardLast4" name="cardLast4" 
                         maxlength="4" pattern="[0-9]{4}"
                         class="w-full border border-gray-300 rounded-lg px-4 py-2">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Mois d'expiration</label>
                  <input type="text" [(ngModel)]="newMethod.cardExpMonth" name="expMonth" 
                         placeholder="MM" maxlength="2"
                         class="w-full border border-gray-300 rounded-lg px-4 py-2">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Année d'expiration</label>
                  <input type="text" [(ngModel)]="newMethod.cardExpYear" name="expYear" 
                         placeholder="YYYY" maxlength="4"
                         class="w-full border border-gray-300 rounded-lg px-4 py-2">
                </div>
              </div>
            </div>

            <!-- Bank Details (if bank account selected) -->
            <div *ngIf="newMethod.type === 'BANK_ACCOUNT'">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nom de la banque</label>
                  <input type="text" [(ngModel)]="newMethod.bankName" name="bankName"
                         class="w-full border border-gray-300 rounded-lg px-4 py-2">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">4 derniers chiffres</label>
                  <input type="text" [(ngModel)]="newMethod.accountLast4" name="accountLast4" 
                         maxlength="4" pattern="[0-9]{4}"
                         class="w-full border border-gray-300 rounded-lg px-4 py-2">
                </div>
              </div>
            </div>

            <!-- Stripe Payment Method ID (optional - for real Stripe integration) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Stripe Payment Method ID (optionnel)
              </label>
              <input type="text" [(ngModel)]="newMethod.stripePaymentMethodId" name="stripeId"
                     placeholder="pm_xxxxx"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2">
              <p class="text-xs text-gray-500 mt-1">
                Pour une vraie intégration Stripe, utilisez Stripe Elements pour collecter les informations de carte.
              </p>
            </div>

            <!-- Set as Default -->
            <div class="flex items-center">
              <input type="checkbox" [(ngModel)]="newMethod.isDefault" name="isDefault" id="isDefault"
                     class="h-4 w-4 text-green-600 rounded border-gray-300">
              <label for="isDefault" class="ml-2 text-sm text-gray-700">
                Définir comme méthode de paiement par défaut
              </label>
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 pt-4 border-t">
              <button type="submit" [disabled]="saving"
                      class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {{saving ? 'Enregistrement...' : 'Ajouter'}}
              </button>
              <button type="button" (click)="cancelAdd()"
                      class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class PaymentSettingsComponent implements OnInit {
  paymentMethods: PaymentMethod[] = [];
  loading = true;
  saving = false;
  showAddForm = false;
  
  newMethod: Partial<PaymentMethod> = {
    type: PaymentType.CREDIT_CARD,
    isDefault: false,
    isActive: true
  };

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadPaymentMethods();
  }

  loadPaymentMethods() {
    this.loading = true;
    this.paymentService.getPaymentMethods().subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentMethods = response.paymentMethods;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
        this.loading = false;
      }
    });
  }

  addPaymentMethod() {
    this.saving = true;
    this.paymentService.addPaymentMethod(this.newMethod as PaymentMethod).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Méthode de paiement ajoutée avec succès!');
          this.loadPaymentMethods();
          this.cancelAdd();
        }
        this.saving = false;
      },
      error: (error) => {
        alert('Erreur lors de l\'ajout de la méthode de paiement');
        console.error('Error adding payment method:', error);
        this.saving = false;
      }
    });
  }

  setDefault(id: string) {
    this.paymentService.setDefaultPaymentMethod(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPaymentMethods();
        }
      },
      error: (error) => {
        alert('Erreur lors de la modification');
        console.error(error);
      }
    });
  }

  deleteMethod(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) return;
    
    this.paymentService.deletePaymentMethod(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPaymentMethods();
        }
      },
      error: (error) => {
        alert('Erreur lors de la suppression');
        console.error(error);
      }
    });
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newMethod = {
      type: PaymentType.CREDIT_CARD,
      isDefault: false,
      isActive: true
    };
  }

  formatPaymentType(type: string): string {
    const types: {[key: string]: string} = {
      'CREDIT_CARD': 'Carte de crédit',
      'DEBIT_CARD': 'Carte de débit',
      'BANK_ACCOUNT': 'Compte bancaire',
      'MOBILE_MONEY': 'Mobile Money',
      'CASH_ON_DELIVERY': 'Paiement à la livraison'
    };
    return types[type] || type;
  }
}
