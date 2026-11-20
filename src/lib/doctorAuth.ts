export interface DoctorSession {
  id: string;
  role: 'doctor' | 'admin';
  doctorId: string | null;
  name: string;
  email: string;
  specialty: string;
}

const AUTH_TOKEN_KEY = 'mediflow_auth_token';
const AUTH_USER_KEY = 'mediflow_doctor_session';
const AUTH_EMAIL_KEY = 'mediflow_user';

function readStorage(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function removeStorage(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

const DOCTOR_DEMO_ACCOUNTS = [
  { email: 'admin@mediflow.com', doctorName: 'Administrateur MediFlow' },
  { email: 'hassan.elidrissi@mediflow.com', doctorName: 'Dr. Hassan El Idrissi' },
  { email: 'sara.bennani@mediflow.com', doctorName: 'Dr. Sara Bennani' },
  { email: 'yasmine.alaoui@mediflow.com', doctorName: 'Dr. Yasmine Alaoui' },
  { email: 'mehdi.chafik@mediflow.com', doctorName: 'Dr. Mehdi Chafik' },
  { email: 'karim.tazi@mediflow.com', doctorName: 'Dr. Karim Tazi' },
  { email: 'amal.lahlou@mediflow.com', doctorName: 'Dr. Amal Lahlou' },
];

export function getStoredAuthToken(): string | null {
  return readStorage(AUTH_TOKEN_KEY);
}

export function getStoredDoctorSession(): DoctorSession | null {
  const raw = readStorage(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DoctorSession;
  } catch {
    return null;
  }
}

export function saveStoredAuth(token: string, session: DoctorSession, persistent = true): void {
  clearStoredAuth();
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(session));
  storage.setItem(AUTH_EMAIL_KEY, session.email);
}

export function clearStoredAuth(): void {
  removeStorage(AUTH_TOKEN_KEY);
  removeStorage(AUTH_USER_KEY);
  removeStorage(AUTH_EMAIL_KEY);
}

export function getStoredUserEmail(): string | null {
  return readStorage(AUTH_EMAIL_KEY);
}

export function getDoctorDemoAccounts() {
  return DOCTOR_DEMO_ACCOUNTS;
}
