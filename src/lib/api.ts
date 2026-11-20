import { Appointment, ArchiveServerInfo, DashboardSummary, Doctor, Patient, ScannedDocument } from '../types';
import { getApiBaseUrl } from './apiBase';
import { DoctorSession, getStoredAuthToken } from './doctorAuth';

const API_BASE_URL = getApiBaseUrl();

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ListPayload<T> {
  items: T[];
}

interface ItemPayload<T> {
  item: T;
}

interface DashboardPayload {
  summary: {
    patients_total: number;
    critical_patients: number;
    appointments_today: number;
    revenue_total: number;
  };
}

interface AuthLoginPayload {
  token: string;
  user: AuthUserApi;
}

type AuthUserApi = {
  id: number;
  role: 'doctor' | 'admin';
  doctorId?: number | null;
  name: string;
  email: string;
  specialty: string;
};

type PatientApi = {
  id: number;
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
  frequency?: string;
};

type DoctorApi = {
  id: number;
  name: string;
  specialty: string;
  age: number;
  profilePic?: string;
  email?: string;
  department?: string;
  availability?: string;
};

type AppointmentApi = {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reminderSent?: boolean;
  notes?: string;
};

export type ImagingStudy = {
  id: string;
  patient: string;
  patientId: string;
  type: string;
  date: string;
  doctor: string;
  status: 'Available' | 'Processing';
  progress?: number;
  imageUrl?: string;
  report?: string;
  isArchived?: boolean;
};

type ImagingStudyApi = {
  id: number;
  patient: string;
  patientId: number;
  type: string;
  date: string;
  doctor: string;
  status: 'Available' | 'Processing';
  progress?: number;
  imageUrl?: string | null;
  report?: string | null;
  isArchived?: boolean;
};

type ArchiveDocumentApi = {
  id: string;
  name: string;
  date: string;
  text?: string;
  patientId?: string | null;
  patientName?: string | null;
  imageUrl?: string | null;
  type?: string | null;
  description?: string | null;
  source?: 'desktop' | 'mobile' | null;
  uploadedAt?: string | null;
};

type ArchiveServerInfoApi = {
  scan_url: string;
  api_base_url: string;
  local_ip: string | null;
  host: string;
};

type ArchiveAnalysisApi = {
  fullText?: string;
  structuredData?: Record<string, unknown>[];
  patientInfo?: {
    name?: string;
    age?: string;
    date?: string;
    diagnosis?: string;
  };
  documentTitle?: string;
  rawText?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const raw = await response.text();
  let data: (ApiEnvelope<T> & { errors?: unknown }) | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as ApiEnvelope<T> & { errors?: unknown };
    } catch {
      throw new Error(`Réponse invalide du serveur (${response.status}) pour ${path}.`);
    }
  }

  if (!data) {
    throw new Error(`Réponse vide du serveur (${response.status}) pour ${path}.`);
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Une erreur API est survenue.');
  }

  return data.data;
}

function mapDoctorSession(user: AuthUserApi): DoctorSession {
  return {
    id: String(user.id),
    role: user.role,
    doctorId: user.doctorId ? String(user.doctorId) : null,
    name: user.name,
    email: user.email,
    specialty: user.specialty,
  };
}

function mapPatient(item: PatientApi): Patient {
  return {
    id: String(item.id),
    patientCode: item.patientCode ?? '',
    name: item.name,
    age: item.age,
    gender: item.gender,
    bloodType: item.bloodType,
    lastVisit: item.lastVisit,
    status: item.status,
    room: item.room ?? '',
    entryDate: item.entryDate ?? '',
    exitDate: item.exitDate ?? '',
    isArchived: Boolean(item.isArchived),
    birthDate: item.birthDate ?? '',
    phone: item.phone ?? '',
    email: item.email ?? '',
    address: item.address ?? '',
    statusDescription: item.statusDescription ?? '',
    medicalHistory: item.medicalHistory ?? '',
    department: item.department ?? '',
    medication: item.medication ?? '',
    dosage: item.dosage ?? '',
    freq: item.frequency ?? '',
  };
}

function mapDoctor(item: DoctorApi): Doctor {
  return {
    id: String(item.id),
    name: item.name,
    specialty: item.specialty,
    age: item.age,
    profilePic: item.profilePic,
    email: item.email ?? '',
    department: item.department ?? '',
    availability: item.availability ?? '',
  };
}

function mapAppointment(item: AppointmentApi): Appointment {
  return {
    id: String(item.id),
    patientId: String(item.patientId),
    patientName: item.patientName,
    doctorId: String(item.doctorId),
    doctorName: item.doctorName,
    date: item.date,
    time: item.time,
    type: item.type,
    status: item.status,
    reminderSent: Boolean(item.reminderSent),
    notes: item.notes ?? '',
  };
}

function normalizeImagingType(type: string): string {
  return type
    .replace(/Ã‰chographie/g, 'Échographie')
    .replace(/Ã©chographie/g, 'échographie')
    .replace(/Echographie/g, 'Échographie');
}

function mapImagingStudy(item: ImagingStudyApi): ImagingStudy {
  return {
    id: String(item.id),
    patient: item.patient,
    patientId: String(item.patientId),
    type: normalizeImagingType(item.type),
    date: item.date,
    doctor: item.doctor,
    status: item.status,
    progress: item.progress,
    imageUrl: item.imageUrl ?? undefined,
    report: item.report ?? undefined,
    isArchived: Boolean(item.isArchived),
  };
}

function mapArchiveDocument(item: ArchiveDocumentApi): ScannedDocument {
  return {
    id: item.id,
    name: item.name,
    date: item.date,
    text: item.text ?? item.description ?? '',
    patientId: item.patientId ?? undefined,
    patientName: item.patientName ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    type: item.type ?? undefined,
    description: item.description ?? undefined,
    source: item.source ?? undefined,
    uploadedAt: item.uploadedAt ?? undefined,
  };
}

function mapArchiveServerInfo(item: ArchiveServerInfoApi): ArchiveServerInfo {
  return {
    scanUrl: item.scan_url,
    apiBaseUrl: item.api_base_url,
    localIp: item.local_ip,
    host: item.host,
  };
}

function buildPatientPayload(patient: Partial<Patient>) {
  return {
    patient_code: patient.patientCode?.trim() || patient.id?.trim() || `PAT-${Date.now()}`,
    name: patient.name,
    age: Number(patient.age ?? 0),
    gender: patient.gender,
    blood_type: patient.bloodType,
    last_visit: patient.lastVisit || new Date().toISOString().split('T')[0],
    status: patient.status,
    room: patient.room || null,
    entry_date: patient.entryDate || null,
    exit_date: patient.exitDate || null,
    birth_date: patient.birthDate || null,
    phone: patient.phone || null,
    email: patient.email || null,
    address: patient.address || null,
    status_description: patient.statusDescription || null,
    medical_history: patient.medicalHistory || null,
    department: patient.department || null,
    medication: patient.medication || null,
    dosage: patient.dosage || null,
    frequency: patient.freq || null,
    is_archived: patient.isArchived ? 1 : 0,
  };
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: DoctorSession }> {
    const payload = await request<AuthLoginPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return {
      token: payload.token,
      user: mapDoctorSession(payload.user),
    };
  },

  async getCurrentSession(): Promise<DoctorSession> {
    const payload = await request<{ user: AuthUserApi }>('/auth/me');
    return mapDoctorSession(payload.user);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const payload = await request<DashboardPayload>('/dashboard/summary');

    return {
      patientsTotal: payload.summary.patients_total,
      criticalPatients: payload.summary.critical_patients,
      appointmentsToday: payload.summary.appointments_today,
      revenueTotal: payload.summary.revenue_total,
    };
  },

  async getPatients(search = ''): Promise<Patient[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const payload = await request<ListPayload<PatientApi>>(`/patients${query}`);
    return payload.items.map(mapPatient);
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const payload = await request<ItemPayload<PatientApi>>('/patients', {
      method: 'POST',
      body: JSON.stringify(buildPatientPayload(patient)),
    });

    return mapPatient(payload.item);
  },

  async updatePatient(id: string, patient: Partial<Patient>): Promise<Patient> {
    const payload = await request<ItemPayload<PatientApi>>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(buildPatientPayload(patient)),
    });

    return mapPatient(payload.item);
  },

  async deletePatient(id: string): Promise<void> {
    try {
      await request<{ deleted: boolean }>(`/patients/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Fallback for environments where DELETE is blocked/re-written by proxy/server.
      await request<{ deleted: boolean }>(`/patients/${id}/delete`, {
        method: 'POST',
      });
    }
  },

  async archivePatient(id: string): Promise<Patient> {
    const payload = await request<ItemPayload<PatientApi>>(`/patients/${id}/archive`, {
      method: 'POST',
    });

    return mapPatient(payload.item);
  },

  async getDoctors(): Promise<Doctor[]> {
    const payload = await request<ListPayload<DoctorApi>>('/doctors');
    return payload.items.map(mapDoctor);
  },

  async createDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const payload = await request<ItemPayload<DoctorApi>>('/doctors', {
      method: 'POST',
      body: JSON.stringify({
        name: doctor.name,
        specialty: doctor.specialty,
        age: doctor.age,
        profile_picture: doctor.profilePic || null,
        email: doctor.email || null,
        department: doctor.department || null,
        availability: doctor.availability || null,
      }),
    });

    return mapDoctor(payload.item);
  },

  async updateDoctor(id: string, doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const payload = await request<ItemPayload<DoctorApi>>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: doctor.name,
        specialty: doctor.specialty,
        age: doctor.age,
        profile_picture: doctor.profilePic || null,
        email: doctor.email || null,
        department: doctor.department || null,
        availability: doctor.availability || null,
      }),
    });

    return mapDoctor(payload.item);
  },

  async deleteDoctor(id: string): Promise<void> {
    await request<{ deleted: boolean }>(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },

  async getAppointments(): Promise<Appointment[]> {
    const payload = await request<ListPayload<AppointmentApi>>('/appointments');
    return payload.items.map(mapAppointment);
  },

  async createAppointment(appointment: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    type: string;
    status?: Appointment['status'];
    reminderSent?: boolean;
    notes?: string;
  }): Promise<Appointment> {
    const payload = await request<ItemPayload<AppointmentApi>>('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: Number(appointment.patientId),
        doctor_id: Number(appointment.doctorId),
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        type: appointment.type,
        status: appointment.status ?? 'Scheduled',
        reminder_sent: appointment.reminderSent ? 1 : 0,
        notes: appointment.notes || null,
      }),
    });

    return mapAppointment(payload.item);
  },

  async updateAppointment(id: string, appointment: {
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    type: string;
    status: Appointment['status'];
    reminderSent?: boolean;
    notes?: string;
  }): Promise<Appointment> {
    const payload = await request<ItemPayload<AppointmentApi>>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        patient_id: Number(appointment.patientId),
        doctor_id: Number(appointment.doctorId),
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        reminder_sent: appointment.reminderSent ? 1 : 0,
        notes: appointment.notes || null,
      }),
    });

    return mapAppointment(payload.item);
  },

  async deleteAppointment(id: string): Promise<void> {
    await request<{ deleted: boolean }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  async getImagingStudies(): Promise<ImagingStudy[]> {
    const payload = await request<ListPayload<ImagingStudyApi>>('/imaging-studies');
    return payload.items.map(mapImagingStudy);
  },

  async createImagingStudy(study: Omit<ImagingStudy, 'id' | 'patient'>): Promise<ImagingStudy> {
    const payload = await request<ItemPayload<ImagingStudyApi>>('/imaging-studies', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: Number(study.patientId),
        exam_type: study.type,
        exam_date: study.date,
        doctor: study.doctor,
        status: study.status,
        progress: study.progress ?? 100,
        image_data_url: study.imageUrl ?? null,
        report: study.report ?? null,
        is_archived: study.isArchived ? 1 : 0,
      }),
    });

    return mapImagingStudy(payload.item);
  },

  async updateImagingStudy(id: string, study: Omit<ImagingStudy, 'id' | 'patient'>): Promise<ImagingStudy> {
    const payload = await request<ItemPayload<ImagingStudyApi>>(`/imaging-studies/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        patient_id: Number(study.patientId),
        exam_type: study.type,
        exam_date: study.date,
        doctor: study.doctor,
        status: study.status,
        progress: study.progress ?? 100,
        image_data_url: study.imageUrl ?? null,
        report: study.report ?? null,
        is_archived: study.isArchived ? 1 : 0,
      }),
    });

    return mapImagingStudy(payload.item);
  },

  async deleteImagingStudy(id: string): Promise<void> {
    try {
      await request<{ deleted: boolean }>(`/imaging-studies/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await request<{ deleted: boolean }>(`/imaging-studies/${id}/delete`, {
        method: 'POST',
      });
    }
  },

  async archiveImagingStudy(id: string): Promise<ImagingStudy> {
    const payload = await request<ItemPayload<ImagingStudyApi>>(`/imaging-studies/${id}/archive`, {
      method: 'POST',
    });

    return mapImagingStudy(payload.item);
  },

  async getArchiveDocuments(): Promise<ScannedDocument[]> {
    const payload = await request<ListPayload<ArchiveDocumentApi>>('/archive/documents');
    return payload.items.map(mapArchiveDocument);
  },

  async deleteArchiveDocument(id: string): Promise<void> {
    try {
      await request<{ deleted: boolean }>(`/archive/documents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      await request<{ deleted: boolean }>(`/archive/documents/${encodeURIComponent(id)}/delete`, {
        method: 'POST',
      });
    }
  },

  async downloadArchiveDocumentImage(id: string): Promise<{ blob: Blob; filename: string }> {
    const token = getStoredAuthToken();
    const response = await fetch(`${API_BASE_URL}/archive/documents/${encodeURIComponent(id)}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Téléchargement impossible (${response.status}).`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] ?? `document_${id}.jpg`;

    return { blob, filename };
  },

  async getArchiveServerInfo(): Promise<ArchiveServerInfo> {
    const payload = await request<ArchiveServerInfoApi>('/archive/server-info');
    return mapArchiveServerInfo(payload);
  },

  async analyzeArchiveDocument(input: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  }): Promise<ArchiveAnalysisApi> {
    return request<ArchiveAnalysisApi>('/archive/analyze', {
      method: 'POST',
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        dataUrl: input.dataUrl,
      }),
    });
  },
};
