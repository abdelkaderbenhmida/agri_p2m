export interface JobOffer {
  id?: string;
  title: string;
  description: string;
  jobType: JobType;
  contractType: ContractType;
  location: string;
  locationLat?: number;
  locationLng?: number;
  salaryMin?: number;
  salaryMax?: number;
  farmerId: string;
  farmerName: string;
  farmName?: string;
  requirements: string[];
  benefits: string[];
  positions: number;
  status: JobStatus;
  applications: JobApplication[];
  applicationDeadline: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export enum JobType {
  SEASONAL = 'SEASONAL',
  PERMANENT = 'PERMANENT',
  TEMPORARY = 'TEMPORARY',
  HARVEST = 'HARVEST',
  GENERAL_FARM_WORK = 'GENERAL_FARM_WORK',
  SPECIALIZED = 'SPECIALIZED'
}

export enum ContractType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP'
}

export enum JobStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED'
}

export interface JobApplication {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  appliedAt: Date | string;
  notes?: string;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEWED = 'INTERVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}
