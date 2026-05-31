import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JobOffer, JobApplication } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  // Get all active job offers
  getAllJobs(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Get job by ID
  getJobById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Get farmer's job offers
  getMyJobOffers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-offers`);
  }

  // Create new job offer
  createJobOffer(job: JobOffer): Observable<any> {
    return this.http.post<any>(this.apiUrl, job);
  }

  // Update job offer
  updateJobOffer(id: string, job: JobOffer): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, job);
  }

  // Delete job offer
  deleteJobOffer(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Apply to job
  applyToJob(jobId: string, application: JobApplication): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${jobId}/apply`, application);
  }

  // Update application status
  updateApplicationStatus(jobId: string, applicationIndex: number, status: string, notes?: string): Observable<any> {
    const body: any = { status };
    if (notes) body.notes = notes;
    return this.http.put<any>(`${this.apiUrl}/${jobId}/applications/${applicationIndex}`, body);
  }
}
