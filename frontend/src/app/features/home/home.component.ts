import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService, GlobalStats } from '../../core/services/stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  
  loading = true;
  globalStats: GlobalStats | null = null;
  features = [
    {
      icon: '🌿',
      title: 'Produits 100% Locaux',
      description: 'Directement de nos fermes tunisiennes vers votre table',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: '🛡️',
      title: 'Qualité Garantie',
      description: 'Certifications Bio et contrôles qualité rigoureux',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: '⚡',
      title: 'Livraison Rapide',
      description: 'Fraîcheur garantie avec livraison express',
      color: 'from-orange-500 to-amber-600'
    },
    {
      icon: '❤️',
      title: 'Impact Social',
      description: 'Soutenez les agriculteurs locaux tunisiens',
      color: 'from-pink-500 to-rose-600'
    }
  ];

  customerBenefits = [
    'Produits ultra-frais récoltés du jour',
    'Prix justes sans intermédiaires',
    'Traçabilité complète de la ferme à la table',
    'Livraison rapide ou retrait à la ferme',
    'Soutien direct aux agriculteurs locaux'
  ];

  farmerBenefits = [
    'Vendez directement sans intermédiaire',
    'Fixez vos propres prix',
    'Gestion simplifiée de vos commandes',
    'Visibilité accrue pour vos produits',
    'Paiements sécurisés et rapides'
  ];
  
  constructor(private statsService: StatsService) {}
  
  ngOnInit(): void {
    this.loadGlobalStats();
  }
  
  loadGlobalStats(): void {
    this.statsService.getGlobalStats().subscribe({
      next: (stats) => {
        this.globalStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading global stats:', error);
        // Fallback to default values if API fails
        this.globalStats = {
          totalFarmers: 500,
          totalProducts: 2000,
          totalOrders: 15000,
          averageRating: 4.8
        };
        this.loading = false;
      }
    });
  }

  get stats() {
    if (!this.globalStats) {
      return [
        { value: '...', label: 'Agriculteurs', icon: '👥' },
        { value: '...', label: 'Produits Frais', icon: '🌿' },
        { value: '...', label: 'Commandes', icon: '📈' },
        { value: '...', label: 'Satisfaction', icon: '⭐' }
      ];
    }
    
    return [
      { value: this.globalStats.totalFarmers + '+', label: 'Agriculteurs', icon: '👥' },
      { value: this.globalStats.totalProducts + '+', label: 'Produits Frais', icon: '🌿' },
      { value: this.globalStats.totalOrders + '+', label: 'Commandes', icon: '📈' },
      { value: this.globalStats.averageRating + '/5', label: 'Satisfaction', icon: '⭐' }
    ];
  }
}
