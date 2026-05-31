import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../core/services/job.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOffer, JobApplication, JobStatus } from '../../core/models/job.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';

@Component({
  selector: 'app-buyer-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, MapViewComponent],
  templateUrl: './buyer-jobs.component.html'
})
export class BuyerJobsComponent implements OnInit {
  jobs: JobOffer[] = [];
  filteredJobs: JobOffer[] = [];
  loading = true;
  currentUser: any;

  // Search & filter
  searchText = '';
  selectedJobType = '';

  // Job detail view
  selectedJob: JobOffer | null = null;
  showDetail = false;

  // Apply modal
  showApplyModal = false;
  applying = false;
  applyError = '';
  applySuccess = '';
  applicationForm: Partial<JobApplication> = {};

  // My applications view
  showMyApplications = false;
  myApplications: Array<{ job: JobOffer; application: JobApplication; applicationIndex: number }> = [];
  loadingMyApps = false;

  jobTypes = ['SEASONAL', 'PERMANENT', 'TEMPORARY', 'HARVEST', 'GENERAL_FARM_WORK', 'SPECIALIZED'];

  constructor(private jobService: JobService, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadJobs();
  }

  loadJobs() {
    this.loading = true;
    this.jobService.getAllJobs().subscribe({
      next: (res) => {
        this.jobs = (res.jobs || res || []).filter((j: JobOffer) => j.status === JobStatus.OPEN);
        this.applySearch();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applySearch() {
    let result = [...this.jobs];
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.farmerName?.toLowerCase().includes(q) ||
        j.farmName?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    if (this.selectedJobType) {
      result = result.filter(j => j.jobType === this.selectedJobType);
    }
    this.filteredJobs = result;
  }

  openDetail(job: JobOffer) {
    this.selectedJob = job;
    this.showDetail = true;
    this.showMyApplications = false;
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedJob = null;
  }

  openApply(job: JobOffer) {
    if (!this.currentUser) {
      alert('Vous devez être connecté pour postuler.');
      return;
    }
    this.selectedJob = job;
    this.applicationForm = { applicantPhone: '', coverLetter: '' };
    this.applyError = '';
    this.applySuccess = '';
    this.showApplyModal = true;
    this.showDetail = false;
  }

  closeModal() {
    this.showApplyModal = false;
  }

  submitApplication() {
    if (!this.applicationForm.coverLetter?.trim()) {
      this.applyError = 'Veuillez rédiger une lettre de motivation.';
      return;
    }
    this.applying = true;
    this.applyError = '';
    this.jobService.applyToJob(this.selectedJob!.id!, this.applicationForm as JobApplication).subscribe({
      next: (res) => {
        this.applying = false;
        if (res.success) {
          this.applySuccess = 'Candidature envoyée avec succès !';
          setTimeout(() => { this.closeModal(); this.applySuccess = ''; }, 2000);
        } else {
          this.applyError = res.message || 'Erreur lors de l\'envoi.';
        }
      },
      error: (err) => {
        this.applying = false;
        this.applyError = err.error?.message || 'Erreur lors de l\'envoi.';
      }
    });
  }

  loadMyApplications() {
    if (!this.currentUser) { alert('Connectez-vous pour voir vos candidatures.'); return; }
    this.showMyApplications = true;
    this.showDetail = false;
    this.loadingMyApps = true;
    this.myApplications = [];

    this.jobService.getAllJobs().subscribe({
      next: (res) => {
        const allJobs: JobOffer[] = res.jobs || res || [];
        const userId = this.currentUser.id;
        allJobs.forEach(job => {
          if (job.applications) {
            job.applications.forEach((app, idx) => {
              if (app.applicantId === userId || app.applicantEmail === this.currentUser.email) {
                this.myApplications.push({ job, application: app, applicationIndex: idx });
              }
            });
          }
        });
        this.loadingMyApps = false;
      },
      error: () => { this.loadingMyApps = false; }
    });
  }

  formatJobType(type: string): string {
    const map: Record<string, string> = {
      SEASONAL: 'Saisonnier', PERMANENT: 'Permanent', TEMPORARY: 'Temporaire',
      HARVEST: 'Récolte', GENERAL_FARM_WORK: 'Travail agricole', SPECIALIZED: 'Spécialisé'
    };
    return map[type] || type;
  }

  formatContractType(type: string): string {
    const map: Record<string, string> = {
      FULL_TIME: 'Temps plein', PART_TIME: 'Temps partiel', CONTRACT: 'Contrat', INTERNSHIP: 'Stage'
    };
    return map[type] || type;
  }

  formatAppStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', REVIEWED: 'Examinée', SHORTLISTED: 'Présélectionné',
      INTERVIEWED: 'Entretien', ACCEPTED: 'Acceptée', REJECTED: 'Refusée'
    };
    return map[status] || status;
  }

  getAppStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-purple-100 text-purple-800',
      INTERVIEWED: 'bg-indigo-100 text-indigo-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
