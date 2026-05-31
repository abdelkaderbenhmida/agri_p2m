import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { JobService } from '../../core/services/job.service';
import { JobOffer, JobType, ContractType, JobStatus } from '../../core/models/job.model';
import { MapPickerComponent, MapLocation } from '../../shared/components/map-picker/map-picker.component';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [CommonModule, FormsModule, MapPickerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4">
        <button (click)="goBack()" class="mb-6 text-green-600 hover:text-green-800">
          ← Retour
        </button>

        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">{{ pageTitle }}</h1>

          <form (ngSubmit)="saveJob()" class="space-y-6">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Titre du poste *</label>
              <input type="text" [(ngModel)]="job.title" name="title" required
                     class="w-full border border-gray-300 rounded-lg px-4 py-2" 
                     placeholder="Ex: Ouvrier agricole saisonnier">
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea [(ngModel)]="job.description" name="description" rows="6" required
                        class="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="Décrivez le poste, les responsabilités, etc."></textarea>
            </div>

            <!-- Job Type & Contract Type -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type d'emploi *</label>
                <select [(ngModel)]="job.jobType" name="jobType" required
                        class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Sélectionner...</option>
                  <option  *ngFor="let type of jobTypes" [value]="type">{{formatJobType(type)}}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type de contrat *</label>
                <select [(ngModel)]="job.contractType" name="contractType" required
                        class="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let type of contractTypes" [value]="type">{{formatContractType(type)}}</option>
                </select>
              </div>
            </div>

            <!-- Location & Positions -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Localisation *</label>
                <input type="text" [(ngModel)]="job.location" name="location" required
                       class="w-full border border-gray-300 rounded-lg px-4 py-2"
                       placeholder="Ville ou région">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de postes *</label>
                <input type="number" [(ngModel)]="job.positions" name="positions" min="1" required
                       class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
            </div>

            <!-- Location map picker -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">📍 Position exacte sur la carte (optionnel)</label>
              <app-map-picker
                [initialLat]="job.locationLat"
                [initialLng]="job.locationLng"
                height="240px"
                (locationChanged)="onJobLocationChanged($event)">
              </app-map-picker>
            </div>

            <!-- Salary Range -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Salaire minimum (DH/mois)</label>
                <input type="number" [(ngModel)]="job.salaryMin" name="salaryMin"
                       class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Salaire maximum (DH/mois)</label>
                <input type="number" [(ngModel)]="job.salaryMax" name="salaryMax"
                       class="w-full border border-gray-300 rounded-lg px-4 py-2">
              </div>
            </div>

            <!-- Farm Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom de l'exploitation</label>
              <input type="text" [(ngModel)]="job.farmName" name="farmName"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>

            <!-- Application Deadline -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date limite de candidature *</label>
              <input type="date" [(ngModel)]="deadlineDate" name="deadline" required
                     class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>

            <!-- Requirements -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Exigences (une par ligne)</label>
              <textarea [(ngModel)]="requirementsText" name="requirements" rows="4"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="Ex:&#10;- Expérience en agriculture&#10;- Permis de conduire&#10;- Disponibilité immédiate"></textarea>
            </div>

            <!-- Benefits -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Avantages (un par ligne)</label>
              <textarea [(ngModel)]="benefitsText" name="benefits" rows="4"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="Ex:&#10;- Logement fourni&#10;- Transport assuré&#10;- Formation offerte"></textarea>
            </div>

            <!-- Status (Edit Mode Only) -->
            <div *ngIf="isEditMode">
              <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select [(ngModel)]="job.status" name="status"
                      class="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="OPEN">Ouverte</option>
                <option value="CLOSED">Fermée</option>
                <option value="FILLED">Pourvue</option>
              </select>
            </div>

            <!-- Submit Buttons -->
            <div class="flex gap-4 pt-6 border-t">
              <button type="submit" [disabled]="saving"
                      class="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {{saving ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : "Publier l'offre")}}
              </button>
              <button type="button" (click)="goBack()"
                      class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class JobCreateComponent implements OnInit {
  job: Partial<JobOffer> = {
    title: '',
    description: '',
    jobType: JobType.GENERAL_FARM_WORK,
    contractType: ContractType.FULL_TIME,
    location: '',
    positions: 1,
    requirements: [],
    benefits: [],
    status: JobStatus.OPEN,
    applications: []
  };

  requirementsText = '';
  benefitsText = '';
  deadlineDate = '';
  isEditMode = false;
  saving = false;

  get pageTitle(): string {
    return this.isEditMode ? "Modifier l'offre" : 'Publier une nouvelle offre';
  }

  jobTypes = Object.values(JobType);
  contractTypes = Object.values(ContractType);

  constructor(
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadJob(id);
    }
  }

  loadJob(id: string) {
    this.jobService.getJobById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.job = response.job;
          this.requirementsText = this.job.requirements?.join('\n') || '';
          this.benefitsText = this.job.benefits?.join('\n') || '';
          if (this.job.applicationDeadline) {
            this.deadlineDate = new Date(this.job.applicationDeadline).toISOString().split('T')[0];
          }
        }
      },
      error: (error) => console.error('Error loading job:', error)
    });
  }

  onJobLocationChanged(loc: MapLocation): void {
    this.job.locationLat = loc.lat;
    this.job.locationLng = loc.lng;
    if (!this.job.location && loc.address) {
      this.job.location = loc.address.split(',').slice(0, 2).join(',').trim();
    }
  }

  saveJob() {
    // Parse requirements and benefits
    this.job.requirements = this.requirementsText.split('\n').filter(r => r.trim());
    this.job.benefits = this.benefitsText.split('\n').filter(b => b.trim());
    // Convert date-only string (YYYY-MM-DD) to LocalDateTime format expected by the backend
    this.job.applicationDeadline = this.deadlineDate && !this.deadlineDate.includes('T')
      ? this.deadlineDate + 'T00:00:00'
      : this.deadlineDate;

    this.saving = true;

    const operation = this.isEditMode
      ? this.jobService.updateJobOffer(this.job.id!, this.job as JobOffer)
      : this.jobService.createJobOffer(this.job as JobOffer);

    operation.subscribe({
      next: (response) => {
        alert(this.isEditMode ? 'Offre mise à jour!' : 'Offre publiée avec succès!');
        this.router.navigate(['/jobs']);
        this.saving = false;
      },
      error: (error) => {
        alert('Erreur lors de l\'enregistrement');
        console.error('Error saving job:', error);
        this.saving = false;
      }
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
}
