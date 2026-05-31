import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const jobRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./jobs.component').then(m => m.JobsComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./job-create.component').then(m => m.JobCreateComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./job-create.component').then(m => m.JobCreateComponent),
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./job-detail.component').then(m => m.JobDetailComponent)
  }
];
