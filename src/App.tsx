import React from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminView } from './components/AdminView';
import { Dashboard } from './components/Dashboard';
import { PatientList } from './components/PatientList';
import { AppointmentView } from './components/AppointmentView';
import { EMRView } from './components/EMRView';
import { LabView } from './components/LabView';
import { ImagingView } from './components/ImagingView';
import { HospitalizationView } from './components/HospitalizationView';
import { BillingView } from './components/BillingView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { View, Patient, Appointment, Doctor, ScannedDocument, DashboardSummary } from './types';
import { cn } from './lib/utils';
import { api } from './lib/api';
import { seedMedicalRecords, seedScannedDocuments } from './lib/demoCatalog';
import {
  clearStoredAuth,
  DoctorSession,
  getStoredAuthToken,
  getStoredDoctorSession,
  getStoredUserEmail,
  saveStoredAuth,
} from './lib/doctorAuth';
import {
  Bell,
  Search,
  Settings as SettingsIcon,
  User,
  AlertCircle,
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar as CalendarIcon,
  RefreshCw,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Synchronisation API', message: 'Le frontend est maintenant connecté au backend MediFlow.', time: 'Maintenant', type: 'success', read: false },
];

const EMPTY_SUMMARY: DashboardSummary = {
  patientsTotal: 0,
  criticalPatients: 0,
  appointmentsToday: 0,
  revenueTotal: 0,
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => Boolean(getStoredAuthToken()) && Boolean(getStoredDoctorSession()),
  );
  const [currentUser, setCurrentUser] = React.useState<string | null>(() => getStoredUserEmail());
  const [currentDoctor, setCurrentDoctor] = React.useState<DoctorSession | null>(() => getStoredDoctorSession());
  const [isCheckingSession, setIsCheckingSession] = React.useState(() => Boolean(getStoredAuthToken()));
  const [currentView, setCurrentView] = React.useState<View>('dashboard');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showEmergencies, setShowEmergencies] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary>(EMPTY_SUMMARY);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [dismissedEmergencyIds, setDismissedEmergencyIds] = React.useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = React.useState(window.navigator.onLine);
  const [emrSearchTerm, setEmrSearchTerm] = React.useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [viewHistory, setViewHistory] = React.useState<View[]>(['dashboard']);
  const [scannedDocuments, setScannedDocuments] = React.useState<ScannedDocument[]>(seedScannedDocuments);
  const [medicalRecords, setMedicalRecords] = React.useState<any[]>(seedMedicalRecords);

  const processedCriticalIds = React.useRef<Set<string>>(new Set());
  const processedEmergencyAptIds = React.useRef<Set<string>>(new Set());

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const item: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      time: 'Maintenant',
      read: false,
    };

    setNotifications((prev) => [item, ...prev].slice(0, 20));
  }, []);

  const loadData = React.useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setIsLoadingData(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      setApiError(null);
      const [patientsData, doctorsData, appointmentsData, dashboardData] = await Promise.all([
        api.getPatients(),
        api.getDoctors(),
        api.getAppointments(),
        api.getDashboardSummary(),
      ]);

      setPatients(patientsData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setSummary(dashboardData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger les donnees du backend.';
      if (
        message.toLowerCase().includes('authentification') ||
        message.toLowerCase().includes('session') ||
        message.includes('401')
      ) {
        clearStoredAuth();
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentDoctor(null);
        setPatients([]);
        setDoctors([]);
        setAppointments([]);
        setSummary(EMPTY_SUMMARY);
      }
      setApiError(message);
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;

    void api.getCurrentSession()
      .then((session) => {
        if (!isMounted) return;
        setCurrentDoctor(session);
        setCurrentUser(session.email);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!isMounted) return;
        clearStoredAuth();
        setCurrentDoctor(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || isCheckingSession) {
      return;
    }

    void loadData();
  }, [isAuthenticated, isCheckingSession, loadData]);

  const visibleDoctors = currentDoctor
    ? currentDoctor.role === 'admin'
      ? doctors
      : doctors.filter((doctor) => doctor.id === currentDoctor.doctorId)
    : doctors;
  const isAdmin = currentDoctor?.role === 'admin';

  const visiblePatients = currentDoctor
    ? isAdmin
      ? patients
      : patients.filter((patient) => patient.department === currentDoctor.specialty)
    : patients;

  const visiblePatientNames = new Set(visiblePatients.map((patient) => patient.name));
  const visibleAppointments = currentDoctor
    ? isAdmin
      ? appointments
      : appointments.filter(
        (appointment) =>
          appointment.doctorId === currentDoctor.doctorId || visiblePatientNames.has(appointment.patientName),
      )
    : appointments;

  const visibleMedicalRecords = medicalRecords.filter((record) => visiblePatientNames.has(record.patient));

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    const criticalPatients = visiblePatients.filter((p) => p.status === 'Critical');
    const emergencyApts = visibleAppointments.filter((a) => a.type === 'Urgence' && a.status === 'Scheduled');

    const newCriticals = criticalPatients.filter((p) => !processedCriticalIds.current.has(p.id));
    const newEmergencyApts = emergencyApts.filter((a) => !processedEmergencyAptIds.current.has(a.id));

    if (newCriticals.length > 0 || newEmergencyApts.length > 0) {
      newCriticals.forEach((p) => processedCriticalIds.current.add(p.id));
      newEmergencyApts.forEach((a) => processedEmergencyAptIds.current.add(a.id));

      const patientNotifications = newCriticals.map((p) => ({
        title: 'URGENCE CRITIQUE',
        message: `Alerte : le patient ${p.name} est en etat critique (${p.room || 'sans chambre'}).`,
        type: 'alert' as const,
      }));

      const aptNotifications = newEmergencyApts.map((a) => ({
        title: 'RDV URGENCE',
        message: `Nouveau rendez-vous d'urgence pour ${a.patientName} a ${a.time} avec ${a.doctorName}.`,
        type: 'alert' as const,
      }));

      [...patientNotifications, ...aptNotifications].forEach(addNotification);
      setShowEmergencies(true);
    }
  }, [visiblePatients, visibleAppointments, addNotification]);

  const handleNavigate = (view: View, search?: string) => {
    if (view === 'emr' && search) {
      setEmrSearchTerm(search);
    } else if (view !== 'emr') {
      setEmrSearchTerm('');
    }

    setViewHistory((prev) => {
      const index = prev.indexOf(view);
      if (index !== -1) {
        return prev.slice(0, index + 1);
      }
      return [...prev, view];
    });

    setCurrentView(view);
  };

  const handleSavePatient = async (patient: Partial<Patient>, patientId?: string) => {
    const scopedPatient = currentDoctor
      ? { ...patient, department: patient.department || currentDoctor.specialty }
      : patient;

    const savedPatient = patientId ? await api.updatePatient(patientId, scopedPatient) : await api.createPatient(scopedPatient);

    setPatients((prev) => {
      if (patientId) {
        return prev.map((item) => (item.id === patientId ? savedPatient : item));
      }
      return [savedPatient, ...prev];
    });

    await loadData(false);
    addNotification({
      title: patientId ? 'Patient mis a jour' : 'Nouveau patient',
      message: `${savedPatient.name} a ete ${patientId ? 'mis a jour' : 'ajoute'} avec succes.`,
      type: 'success',
    });
  };

  const handleDeletePatient = async (id: string) => {
    const patient = patients.find((item) => item.id === id);
    await api.deletePatient(id);
    setPatients((prev) => prev.filter((item) => item.id !== id));
    setAppointments((prev) => prev.filter((item) => item.patientId !== id));
    await loadData(false);

    if (patient) {
      addNotification({
        title: 'Patient supprime',
        message: `${patient.name} a ete supprime du systeme.`,
        type: 'info',
      });
    }
  };

  const handleArchivePatient = async (id: string) => {
    const archived = await api.archivePatient(id);
    setPatients((prev) => prev.map((item) => (item.id === id ? archived : item)));
    await loadData(false);
    addNotification({
      title: 'Patient archive',
      message: `${archived.name} a ete deplace dans les archives.`,
      type: 'info',
    });
  };

  const handleSaveAppointment = async (
    appointment: {
      patientId: string;
      doctorId: string;
      date: string;
      time: string;
      type: string;
      status?: Appointment['status'];
      reminderSent?: boolean;
      notes?: string;
    },
    appointmentId?: string,
  ) => {
    const saved = appointmentId
      ? await api.updateAppointment(appointmentId, {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          status: appointment.status ?? 'Scheduled',
          reminderSent: appointment.reminderSent,
          notes: appointment.notes,
        })
      : await api.createAppointment(appointment);

    setAppointments((prev) => {
      if (appointmentId) {
        return prev.map((item) => (item.id === appointmentId ? saved : item));
      }
      return [saved, ...prev];
    });

    await loadData(false);
    addNotification({
      title: appointmentId ? 'Rendez-vous mis a jour' : 'Nouveau rendez-vous',
      message: `Le rendez-vous de ${saved.patientName} a ete enregistre.`,
      type: 'success',
    });
  };

  const handleDeleteAppointment = async (id: string) => {
    await api.deleteAppointment(id);
    setAppointments((prev) => prev.filter((item) => item.id !== id));
    await loadData(false);
  };

  const handleSaveDoctor = async (doctor: Omit<Doctor, 'id'>, doctorId?: string) => {
    const savedDoctor = doctorId ? await api.updateDoctor(doctorId, doctor) : await api.createDoctor(doctor);

    setDoctors((prev) => {
      if (doctorId) {
        return prev.map((item) => (item.id === doctorId ? savedDoctor : item));
      }
      return [...prev, savedDoctor];
    });

    await loadData(false);
  };

  const handleDeleteDoctor = async (id: string) => {
    await api.deleteDoctor(id);
    setDoctors((prev) => prev.filter((item) => item.id !== id));
    await loadData(false);
  };

  const emergencyCases = [
    ...patients
      .filter((p) => p.status === 'Critical')
      .map((p) => ({
        id: `p-${p.id}`,
        patient: p.name,
        room: p.room || 'Urgences',
        condition: 'Etat critique',
        time: 'Maintenant',
        type: 'patient',
      })),
    ...appointments
      .filter((a) => a.type === 'Urgence' && a.status === 'Scheduled')
      .map((a) => ({
        id: `a-${a.id}`,
        patient: a.patientName,
        room: 'Salle d attente',
        condition: 'RDV urgence',
        time: a.time,
        type: 'appointment',
      })),
  ].filter((e) => !dismissedEmergencyIds.has(e.id));

  const handleDismissEmergency = (id: string) => {
    setDismissedEmergencyIds((prev) => new Set([...prev, id]));
  };

  const handleMarkAllTreated = async () => {
    const criticalPatients = patients.filter((p) => p.status === 'Critical');
    const emergencyAppointments = appointments.filter((a) => a.type === 'Urgence' && a.status === 'Scheduled');

    await Promise.all([
      ...criticalPatients.map((patient) =>
        api.updatePatient(patient.id, { ...patient, status: 'Stable' }),
      ),
      ...emergencyAppointments.map((appointment) =>
        api.updateAppointment(appointment.id, {
          patientId: appointment.patientId || '',
          doctorId: appointment.doctorId || '',
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          status: 'Completed',
          reminderSent: appointment.reminderSent,
          notes: appointment.notes,
        }),
      ),
    ]);

    setDismissedEmergencyIds(new Set());
    setShowEmergencies(false);
    await loadData(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin" />
          <span className="font-medium">Verification de la session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={async (email, password, remember) => {
          const auth = await api.login(email, password);
          const doctorSession = auth.user;

          saveStoredAuth(auth.token, doctorSession, remember);

          setIsAuthenticated(true);
          setCurrentUser(doctorSession.email);
          setCurrentDoctor(doctorSession);
          setCurrentView(doctorSession.role === 'admin' ? 'admin' : 'dashboard');
          setViewHistory([doctorSession.role === 'admin' ? 'admin' : 'dashboard']);

          await loadData();
        }}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            patients={visiblePatients}
            notifications={notifications}
            summary={summary}
            currentDoctorName={currentDoctor?.name}
            currentSpecialty={currentDoctor?.specialty}
            onNavigate={handleNavigate}
            onSearch={setGlobalSearch}
          />
        );
      case 'admin':
        return (
          <AdminView
            doctors={doctors}
            patients={patients}
            appointments={appointments}
            notifications={notifications}
            onNavigate={handleNavigate}
          />
        );
      case 'patients':
        return (
          <PatientList
            externalSearchTerm={globalSearch}
            patients={visiblePatients}
            onNavigate={handleNavigate}
            onSavePatient={handleSavePatient}
            onDeletePatient={handleDeletePatient}
            onArchivePatient={handleArchivePatient}
          />
        );
      case 'appointments':
        return (
            <AppointmentView
            patients={visiblePatients}
            onNavigate={handleNavigate}
            onSearch={setGlobalSearch}
            appointments={visibleAppointments}
            doctors={visibleDoctors}
            onSaveAppointment={handleSaveAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onDeletePatient={handleDeletePatient}
            onArchivePatient={handleArchivePatient}
          />
        );
      case 'emr':
        return (
            <EMRView
            patients={visiblePatients}
            initialSearchTerm={emrSearchTerm}
            records={visibleMedicalRecords}
            setRecords={setMedicalRecords}
            onArchiveRecord={(record) => {
              setPatients((prev) =>
                prev.map((p) => {
                  if (p.name === record.patient) {
                    return {
                      ...p,
                      isArchived: true,
                      exitDate: p.exitDate || new Date().toISOString().split('T')[0],
                    };
                  }
                  return p;
                }),
              );
            }}
          />
        );
      case 'lab':
        return <LabView patients={visiblePatients} />;
      case 'imaging':
        return <ImagingView patients={visiblePatients} />;
      case 'hospitalization':
        return <HospitalizationView patients={visiblePatients} />;
      case 'billing':
        return <BillingView patients={visiblePatients} />;
      case 'archive':
        return (
          <ArchiveView
            patients={visiblePatients}
            setPatients={setPatients}
            scannedDocuments={scannedDocuments}
            setScannedDocuments={setScannedDocuments}
            medicalRecords={visibleMedicalRecords}
          />
        );
      case 'settings':
        return (
          <SettingsView
            doctors={visibleDoctors}
            patients={visiblePatients}
            appointments={visibleAppointments}
            notifications={notifications}
            onSaveDoctor={handleSaveDoctor}
            onDeleteDoctor={handleDeleteDoctor}
          />
        );
      default:
        return (
          <Dashboard
            patients={visiblePatients}
            notifications={notifications}
            summary={summary}
            currentDoctorName={currentDoctor?.name}
            currentSpecialty={currentDoctor?.specialty}
            onNavigate={setCurrentView}
            onSearch={setGlobalSearch}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
        <Sidebar
          currentView={currentView}
          viewHistory={viewHistory}
          currentDoctorName={currentDoctor?.name}
          currentSpecialty={currentDoctor?.specialty}
          isAdmin={isAdmin}
          onViewChange={handleNavigate}
          onLogoutRequest={() => setShowLogoutConfirm(true)}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto custom-scrollbar">
          <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalSearch(val);
                  if (val && currentView === 'dashboard') {
                    setCurrentView('patients');
                  }
                }}
                placeholder="Rechercher un patient, un dossier, un resultat..."
                className="w-full pl-10 pr-10 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all text-slate-900"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => void loadData(false)}
                className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Rafraichir les donnees"
              >
                <RefreshCw size={20} className={cn(isRefreshing && 'animate-spin')} />
              </button>

              <div className="flex items-center gap-1 mr-4">
                <div className={cn('w-2 h-2 rounded-full animate-pulse', isOnline ? 'bg-emerald-500' : 'bg-red-500')}></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isOnline ? 'Systeme en ligne' : 'Hors ligne'}
                </span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(
                    'p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-slate-100 rounded-xl transition-all relative',
                    showNotifications && 'bg-slate-100 text-hospital-blue-600',
                  )}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h4 className="font-bold text-slate-900">Notifications</h4>
                      <span className="px-2 py-0.5 bg-hospital-blue-100 text-hospital-blue-600 rounded-lg text-[10px] font-bold">{unreadCount} nouvelles</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.map((n) => (
                        <div key={n.id} className={cn('p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer', !n.read && 'bg-hospital-blue-500/10')}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-slate-900">{n.title}</p>
                            <span className="text-[10px] text-slate-400 uppercase">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                      className="w-full p-3 text-xs font-bold text-hospital-blue-600 hover:bg-slate-50 transition-colors"
                    >
                      Marquer tout comme lu
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowEmergencies(!showEmergencies)}
                  className={cn(
                    'p-2 rounded-xl transition-all relative',
                    showEmergencies
                      ? 'bg-red-100 text-red-600'
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50',
                    emergencyCases.length > 0 && 'animate-pulse',
                  )}
                  title={`Urgences (${emergencyCases.length})`}
                >
                  <AlertCircle size={20} />
                  {emergencyCases.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {emergencyCases.length}
                    </span>
                  )}
                </button>

                {showEmergencies && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-4 bg-red-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <h4 className="font-bold">Urgences actives</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => void handleMarkAllTreated()} className="p-1.5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors" title="Tout traiter">
                          Tout traiter
                        </button>
                        <button onClick={() => setShowEmergencies(false)} className="p-1 hover:bg-white/10 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar bg-white">
                      {emergencyCases.map((e) => (
                        <div key={e.id} className={cn('p-3 border-b border-slate-100 last:border-0 hover:bg-red-50 transition-colors rounded-xl relative group/item', e.type === 'appointment' && 'bg-amber-50 border-amber-100')}>
                          <button onClick={() => handleDismissEmergency(e.id)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover/item:opacity-100 transition-all" title="Ignorer">
                            <X size={14} />
                          </button>
                          <div className="flex justify-between items-start mb-1 pr-6">
                            <div className="flex items-center gap-2">
                              {e.type === 'appointment' ? <CalendarIcon size={14} className="text-amber-400" /> : <AlertCircle size={14} className="text-red-400" />}
                              <p className="text-sm font-bold text-slate-900">{e.patient}</p>
                            </div>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg', e.type === 'appointment' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10')}>{e.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-1">Emplacement: <span className="font-bold text-slate-700">{e.room}</span></p>
                          <p className={cn('text-xs font-medium', e.type === 'appointment' ? 'text-amber-400' : 'text-red-400')}>{e.condition}</p>
                        </div>
                      ))}
                      {emergencyCases.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                          <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-20" />
                          <p className="text-xs font-medium">Aucune urgence active</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setGlobalSearch('status:Critical');
                        setCurrentView('patients');
                        setShowEmergencies(false);
                      }}
                      className="w-full p-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                    >
                      Ouvrir le centre d urgence
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentView('settings')}
                className={cn(
                  'p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-slate-100 rounded-xl transition-all',
                  currentView === 'settings' && 'bg-slate-100 text-hospital-blue-600',
                )}
              >
                <SettingsIcon size={20} />
              </button>

              <div className="h-8 w-px bg-slate-200 mx-2"></div>

              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{currentDoctor?.name || currentUser?.split('@')[0] || 'medecin'}</p>
                  <p className="text-[10px] font-bold text-hospital-blue-600 uppercase tracking-wider">{currentDoctor?.specialty || 'Medecin'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-hospital-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-hospital-blue-600/20 overflow-hidden">
                  <User size={20} />
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 max-w-[1600px] mx-auto w-full">
            {apiError && (
              <div className="mb-6 p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 flex items-center justify-between">
                <div>
                  <p className="font-bold">Connexion backend echouee</p>
                  <p className="text-sm">{apiError}</p>
                </div>
                <button onClick={() => void loadData(false)} className="px-4 py-2 rounded-xl bg-white text-red-600 font-bold">
                  Reessayer
                </button>
              </div>
            )}

            {isLoadingData ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                  <RefreshCw size={20} className="animate-spin" />
                  <span className="font-medium">Chargement des donnees...</span>
                </div>
              </div>
            ) : (
              renderView()
            )}
          </div>

        </main>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowLogoutConfirm(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowLogoutConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-50 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-lg font-bold">Confirmer la deconnexion</h4>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Etes-vous sur de vouloir vous deconnecter ? Vous devrez vous reconnecter pour acceder a nouveau au systeme.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                    setCurrentDoctor(null);
                    setPatients([]);
                    setDoctors([]);
                    setAppointments([]);
                    setSummary(EMPTY_SUMMARY);
                    clearStoredAuth();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
                >
                  Se deconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
