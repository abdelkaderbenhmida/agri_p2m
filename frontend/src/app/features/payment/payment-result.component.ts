import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">

        <!-- Loading -->
        <div *ngIf="loading" class="text-gray-500">
          <div class="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mx-auto mb-5"></div>
          <p class="font-semibold text-gray-700">Vérification du paiement…</p>
          <p class="text-sm text-gray-400 mt-1">Veuillez patienter</p>
        </div>

        <!-- Success -->
        <div *ngIf="!loading && success">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">✅</div>
          <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Paiement réussi !</h2>
          <p class="text-gray-500 mb-6">Votre commande est confirmée et sera préparée par l'agriculteur.</p>
          <button (click)="goToOrders()"
                  class="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition">
            Voir mes commandes
          </button>
        </div>

        <!-- Failure -->
        <div *ngIf="!loading && !success">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">❌</div>
          <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Paiement échoué</h2>
          <p class="text-gray-500 mb-6">Le paiement n'a pas pu être effectué. Vous pouvez réessayer depuis vos commandes.</p>
          <button (click)="goToOrders()"
                  class="w-full py-3.5 bg-gray-800 hover:bg-gray-900 text-white rounded-2xl font-bold transition">
            Retour à mes commandes
          </button>
        </div>

      </div>
    </div>
  `
})
export class PaymentResultComponent implements OnInit {
  loading = true;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const orderId = params.get('orderId');
    const paymentRef = params.get('payment_ref');
    const failed = params.get('failed');

    if (failed === 'true') {
      this.loading = false;
      this.success = false;
      return;
    }

    if (!orderId || !paymentRef) {
      // Missing params — cannot verify
      this.loading = false;
      this.success = false;
      return;
    }

    this.orderService.verifyKonnectPayment(paymentRef, orderId).subscribe({
      next: ({ success }) => {
        this.success = success;
        this.loading = false;
        if (success) {
          this.toastService.success('Paiement confirmé ! Commande en préparation.');
          setTimeout(() => this.goToOrders(), 2500);
        }
      },
      error: () => {
        this.loading = false;
        this.success = false;
      }
    });
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }
}
