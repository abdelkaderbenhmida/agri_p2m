import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JobService } from '../../core/services/job.service';
import { JobOffer, JobType, ContractType } from '../../core/models/job.model';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Offres d'Emploi Agricoles</h1>
            <p class="mt-2 text-gray-600">Trouvez votre prochain emploi dans le secteur agricole</p>
          </div>
          <button 
            *ngIf="canCreateJobs()"
            (click)="navigateToCreate()"
            class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-plus mr-2"></i>Publier une Offre
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (input)="filterJobs()"
              placeholder="Rechercher..." 
              class="border border-gray-300 rounded-lg px-4 py-2">
            <select 
              [(ngModel)]="selectedJobType"
              (change)="filterJobs()"
              class="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Tous les types</option>
              <option *ngFor="let type of jobTypes" [value]="type">{{formatJobType(type)}}</option>
            </select>
            <select 
              [(ngModel)]="selectedContractType"
              (change)="filterJobs()"
              class="border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Tous les contrats</option>
              <option *ngFor="let type of contractTypes" [value]="type">{{formatContractType(type)}}</option>
            </select>
            <input 
              type="text" 
              [(ngModel)]="locationFilter"
              (input)="filterJobs()"
              placeholder="Localisation" 
              class="border border-gray-300 rounded-lg px-4 py-2">
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p class="mt-4 text-gray-600">Chargement des offres...</p>
        </div>

        <!-- Jobs Grid -->
        <div *ngIf="!loading && filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let job of filteredJobs" 
               class="bg-white rounded-lg shadow-md hover:shadow-xl transition cursor-pointer"
               (click)="viewJob(job.id!)">
            <div class="p-6">
              <!-- Header -->
              <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {{formatJobType(job.jobType)}}
                </span>
                <span class="text-gray-500 text-sm">{{formatDate(job.createdAt)}}</span>
              </div>

              <!-- Title & Company -->
              <h3 class="text-xl font-bold text-gray-900 mb-2">{{job.title}}</h3>
              <p class="text-gray-600 mb-4">
                <i class="fas fa-building mr-2"></i>{{job.farmerName || job.farmName}}
              </p>

              <!-- Details -->
              <div class="space-y-2 mb-4">
                <p class="text-gray-700 flex items-center">
                  <i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>
                  {{job.location}}
                </p>
                <p class="text-gray-700 flex items-center">
                  <i class="fas fa-briefcase mr-2 text-gray-400"></i>
                  {{formatContractType(job.contractType)}}
                </p>
                <p *ngIf="job.salaryMin && job.salaryMax" class="text-gray-700 flex items-center">
                  <i class="fas fa-dollar-sign mr-2 text-gray-400"></i>
                  {{job.salaryMin}} - {{job.salaryMax}} DH/mois
                </p>
                <p class="text-gray-700 flex items-center">
                  <i class="fas fa-users mr-2 text-gray-400"></i>
                  {{job.positions}} poste(s) disponible(s)
                </p>
              </div>

              <!-- Description Preview -->
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{job.description}}</p>

              <!-- Footer -->
              <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                <span class="text-sm text-gray-500">
                  {{job.applications?.length || 0}} candidature(s)
                </span>
                <button class="text-green-600 hover:text-green-800 font-semibold">
                  Voir détails →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredJobs.length === 0" class="text-center py-12">
          <i class="fas fa-briefcase text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Aucune offre trouvée</h3>
          <p class="text-gray-600">Aucune offre ne correspond à vos critères de recherche.</p>
        </div>
      </div>
    </div>
  `
})
export class JobsComponent implements OnInit {
  jobs: JobOffer[] = [];
  filteredJobs: JobOffer[] = [];
  loading = true;
  
  searchTerm = '';
  selectedJobType = '';
  selectedContractType = '';
  locationFilter = '';
  
  jobTypes = Object.values(JobType);
  contractTypes = Object.values(ContractType);

  constructor(
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading = true;
    this.jobService.getAllJobs().subscribe({
      next: (response) => {
        if (response.success) {
          this.jobs = response.jobs;
          this.filteredJobs = this.jobs;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.loading = false;
      }
    });
  }

  filterJobs() {
    this.filteredJobs = this.jobs.filter(job => {
      const matchesSearch = !this.searchTerm || 
        job.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesJobType = !this.selectedJobType || job.jobType === this.selectedJobType;
      const matchesContractType = !this.selectedContractType || job.contractType === this.selectedContractType;
      const matchesLocation = !this.locationFilter || 
        job.location.toLowerCase().includes(this.locationFilter.toLowerCase());
      
      return matchesSearch && matchesJobType && matchesContractType && matchesLocation;
    });
  }

  viewJob(id: string) {
    this.router.navigate(['/jobs', id]);
  }

  navigateToCreate() {
    this.router.navigate(['/jobs/create']);
  }

  canCreateJobs(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'FARMER';
  }

  formatJobType(type: string): string {
    const types: {[key: string]: string} = {
      'SEASONAL': 'Saisonnier',
      'PERMANENT': 'Permanent',
      'TEMPORARY': 'Temporaire',
      'HARVEST': 'Récolte',
      'GENERAL_FARM_WORK': 'Travaux Généraux',
      'SPECIALIZED': 'Spécialisé'
    };
    return types[type] || type;
  }

  formatContractType(type: string): string {
    const types: {[key: string]: string} = {
      'FULL_TIME': 'Temps Plein',
      'PART_TIME': 'Temps Partiel',
      'CONTRACT': 'Contrat',
      'INTERNSHIP': 'Stage'
    };
    return types[type] || type;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR');
  }
}
