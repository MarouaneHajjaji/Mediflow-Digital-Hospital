export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  age: number;
  profilePic?: string;
  email?: string;
  department?: string;
  availability?: string;
}

export type View = 
  | 'dashboard' 
  | 'admin'
  | 'patients' 
  | 'appointments' 
  | 'emr' 
  | 'lab' 
  | 'imaging' 
  | 'hospitalization' 
  | 'billing' 
  | 'archive'
  | 'settings';

export interface Patient {
  id: string;
  patientCode?: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  bloodType: string;
  lastVisit: string;
  status: 'Stable' | 'Critical' | 'Recovering';
  room?: string;
  entryDate?: string;
  exitDate?: string;
  isArchived?: boolean;
  birthDate?: string;
  phone?: string;
  email?: string;
  address?: string;
  statusDescription?: string;
  medicalHistory?: string;
  department?: string;
  medication?: string;
  dosage?: string;
  freq?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientId?: string;
  doctorId?: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reminderSent?: boolean;
  notes?: string;
}

export interface LabResult {
  id: string;
  patientName: string;
  testName: string;
  date: string;
  status: 'Pending' | 'Completed';
  result?: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid' | 'Pending';
}

export interface ScannedDocument {
  id: string;
  name: string;
  date: string;
  text: string;
  patientId?: string;
  patientName?: string;
  imageUrl?: string;
  type?: string;
  description?: string;
  source?: 'desktop' | 'mobile';
  uploadedAt?: string;
}

export interface ArchiveServerInfo {
  scanUrl: string;
  apiBaseUrl: string;
  localIp: string | null;
  host: string;
}

export interface DashboardSummary {
  patientsTotal: number;
  criticalPatients: number;
  appointmentsToday: number;
  revenueTotal: number;
}
