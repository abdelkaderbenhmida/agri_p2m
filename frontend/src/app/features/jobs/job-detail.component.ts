import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobService } from '../../core/services/job.service';
import { JobOffer, JobApplication, ApplicationStatus } from '../../core/models/job.model';
import { FormsModule } from '@angular/forms';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MapViewComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <button (click)="goBack()" class="mb-6 text-green-600 hover:text-green-800">
          ← Retour aux offres
        </button>

        <div *ngIf="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>

        <div *ngIf="!loading && job" class="bg-white rounded-lg shadow-lg p-8">
          <!-- Header -->
          <div class="border-b pb-6 mb-6">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{job.title}}</h1>
                <p class="text-xl text-gray-700 mb-4">{{job.farmerName || job.farmName}}</p>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">{{formatJobType(job.jobType)}}</span>
                  <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{{formatContractType(job.contractType)}}</span>
                  <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">{{job.positions}} poste(s)</span>
                </div>
              </div>
              <div *ngIf="isOwnJob()" class="flex gap-2">
                <button (click)="editJob()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-edit"></i> Modifier
                </button>
                <button (click)="deleteJob()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              </div>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2"><i class="fas fa-map-marker-alt mr-2"></i>Localisation</h3>
              <p class="text-gray-700">{{job.location}}</p>
              <div *ngIf="job.locationLat && job.locationLng" class="mt-2">
                <app-map-view [lat]="job.locationLat" [lng]="job.locationLng" [label]="job.location" height="180px"></app-map-view>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2"><i class="fas fa-dollar-sign mr-2"></i>Salaire</h3>
              <p class="text-gray-700">{{job.salaryMin}} - {{job.salaryMax}} DH/mois</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2"><i class="fas fa-calendar mr-2"></i>Date limite</h3>
              <p class="text-gray-700">{{formatFullDate(job.applicationDeadline)}}</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2"><i class="fas fa-users mr-2"></i>Candidatures</h3>
              <p class="text-gray-700">{{job.applications?.length || 0}} reçue(s)</p>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Description du poste</h3>
            <p class="text-gray-700 whitespace-pre-wrap">{{job.description}}</p>
          </div>

          <!-- Requirements -->
          <div class="mb-8" *ngIf="job.requirements && job.requirements.length > 0">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Exigences</h3>
            <ul class="list-disc list-inside space-y-2">
              <li *ngFor="let req of job.requirements" class="text-gray-700">{{req}}</li>
            </ul>
          </div>

          <!-- Benefits -->
          <div class="mb-8" *ngIf="job.benefits && job.benefits.length > 0">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Avantages</h3>
            <ul class="list-disc list-inside space-y-2">
              <li *ngFor="let benefit of job.benefits" class="text-gray-700">{{benefit}}</li>
            </ul>
          </div>

          <!-- Application Form -->
          <div *ngIf="!isOwnJob() && job.status === 'OPEN'" class="border-t pt-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Postuler à cette offre</h3>
            <form (ngSubmit)="submitApplication()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input type="tel" [(ngModel)]="application.applicantPhone" name="phone" 
                       class="w-full border border-gray-300 rounded-lg px-4 py-2" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lettre de motivation</label>
                <textarea [(ngModel)]="application.coverLetter" name="coverLetter" rows="6"
                          class="w-full border border-gray-300 rounded-lg px-4 py-2" required></textarea>
              </div>
              <button type="submit" [disabled]="submitting" 
                      class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {{submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}}
              </button>
            </form>
          </div>

          <!-- Applications List (For Farmer Only) -->
          <div *ngIf="isOwnJob() && job.applications && job.applications.length > 0" class="border-t pt-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">Candidatures reçues</h3>
            <div *ngFor="let app of job.applications; let i = index" class="border border-gray-200 rounded-lg p-4 mb-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <h4 class="font-semibold text-lg">{{app.applicantName}}</h4>
                  <p class="text-gray-600">{{app.applicantEmail}} • {{app.applicantPhone}}</p>
                  <p class="text-sm text-gray-500">Postulé le {{formatFullDate(app.appliedAt)}}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm" [ngClass]="getStatusClass(app.status)">
                  {{formatStatus(app.status)}}
                </span>
              </div>
              <p class="text-gray-700 mb-3 whitespace-pre-wrap">{{app.coverLetter}}</p>
              <div class="flex gap-2">
                <button (click)="updateStatus(i, 'SHORTLISTED')" class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">Présélectionner</button>
                <button (click)="updateStatus(i, 'INTERVIEWED')" class="px-3 py-1 bg-blue-100 text-blue-800 rounded">Entretien</button>
                <button (click)="updateStatus(i, 'ACCEPTED')" class="px-3 py-1 bg-green-100 text-green-800 rounded">Accepter</button>
                <button (click)="updateStatus(i, 'REJECTED')" class="px-3 py-1 bg-red-100 text-red-800 rounded">Rejeter</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class JobDetailComponent implements OnInit {
  job: JobOffer | null = null;
  loading = true;
  submitting = false;
  application: Partial<JobApplication> = {
    applicantPhone: '',
    coverLetter: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadJob(id);
  }

  loadJob(id: string) {
    this.loading = true;
    this.jobService.getJobById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.job = response.job;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading job:', error);
        this.loading = false;
      }
    });
  }

  submitApplication() {
    if (!this.job || !this.application.coverLetter || !this.application.applicantPhone) return;
    
    this.submitting = true;
    this.jobService.applyToJob(this.job.id!, this.application as JobApplication).subscribe({
      next: (response) => {
        alert('Candidature envoyée avec succès!');
        this.loadJob(this.job!.id!);
        this.application = { applicantPhone: '', coverLetter: '' };
        this.submitting = false;
      },
      error: (error) => {
        alert('Erreur lors de l\'envoi de la candidature');
        this.submitting = false;
      }
    });
  }

  updateStatus(index: number, status: string) {
    if (!this.job) return;
    this.jobService.updateApplicationStatus(this.job.id!, index, status).subscribe({
      next: () => {
        alert('Statut mis à jour');
        this.loadJob(this.job!.id!);
      },
      error: () => alert('Erreur lors de la mise à jour')
    });
  }

  isOwnJob(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.job?.farmerId === user.id;
  }

  editJob() {
    this.router.navigate(['/jobs/edit', this.job?.id]);
  }

  deleteJob() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;
    this.jobService.deleteJobOffer(this.job!.id!).subscribe({
      next: () => {
        alert('Offre supprimée');
        this.router.navigate(['/jobs']);
      },
      error: () => alert('Erreur lors de la suppression')
    });
  }

  goBack() {
    this.router.navigate(['/jobs']);
  }

  formatJobType(type: string): string {
    const types: {[key: string]: string} = {
      'SEASONAL': 'Saisonnier', 'PERMANENT': 'Permanent', 'TEMPORARY': 'Temporaire',
      'HARVEST': 'Récolte', 'GENERAL_FARM_WORK': 'Travaux Généraux', 'SPECIALIZED': 'Spécialisé'
    };
    return types[type] || type;
  }

  formatContractType(type: string): string {
    const types: {[key: string]: string} = {
      'FULL_TIME': 'Temps Plein', 'PART_TIME': 'Temps Partiel',
      'CONTRACT': 'Contrat', 'INTERNSHIP': 'Stage'
    };
    return types[type] || type;
  }

  formatStatus(status: string): string {
    const statuses: {[key: string]: string} = {
      'PENDING': 'En attente', 'REVIEWED': 'Examinée', 'SHORTLISTED': 'Présélectionnée',
      'INTERVIEWED': 'Entretien', 'ACCEPTED': 'Acceptée', 'REJECTED': 'Rejetée'
    };
    return statuses[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: {[key: string]: string} = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'REVIEWED': 'bg-blue-100 text-blue-800',
      'SHORTLISTED': 'bg-yellow-100 text-yellow-800',
      'INTERVIEWED': 'bg-purple-100 text-purple-800',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatFullDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  }
}
