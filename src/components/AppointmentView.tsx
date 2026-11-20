import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  User,
  Stethoscope,
  Edit2,
  Archive,
  Trash2,
  AlertCircle,
  Send,
  Check,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
  subDays,
  isWithinInterval,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Appointment, Patient, View, Doctor } from '../types';
import { cn } from '../lib/utils';

interface AppointmentViewProps {
  patients: Patient[];
  onNavigate: (view: View, search?: string) => void;
  onSearch: (term: string) => void;
  appointments: Appointment[];
  doctors: Doctor[];
  onSaveAppointment: (
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
    appointmentId?: string
  ) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  onArchivePatient: (id: string) => Promise<void>;
}

export const AppointmentView: React.FC<AppointmentViewProps> = ({
  patients,
  onNavigate,
  onSearch,
  appointments,
  doctors,
  onSaveAppointment,
  onDeleteAppointment,
  onDeletePatient,
  onArchivePatient,
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [newApt, setNewApt] = useState<Partial<Appointment>>({
    patientName: '',
    doctorName: doctors[0]?.name || 'Dr. Hassan El Idrissi',
    time: '09:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'Consultation',
    status: 'Scheduled',
  });

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.patientName || !newApt.time || !newApt.date) return;

    const matchedPatient = patients.find((p) => p.name.toLowerCase() === newApt.patientName!.toLowerCase());
    const matchedDoctor = doctors.find((d) => d.name === newApt.doctorName);

    if (!matchedPatient || !matchedDoctor) return;

    await onSaveAppointment({
      patientId: matchedPatient.id,
      doctorId: matchedDoctor.id,
      date: newApt.date,
      time: newApt.time,
      type: newApt.type || 'Consultation',
      status: 'Scheduled',
    });

    const newDate = parseISO(newApt.date);
    setSelectedDate(newDate);
    if (!isSameMonth(newDate, viewDate)) setViewDate(startOfMonth(newDate));

    setIsModalOpen(false);
    setNewApt({
      patientName: '',
      doctorName: doctors[0]?.name || 'Dr. Hassan El Idrissi',
      time: '09:00',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Consultation',
      status: 'Scheduled',
    });
  };

  const handleSendReminders = () => {
    setIsSendingReminders(true);

    setTimeout(() => {
      const tomorrow = addDays(new Date(), 1);
      const count = appointments.filter(
        (apt) => isSameDay(parseISO(apt.date), tomorrow) && apt.status === 'Scheduled' && !apt.reminderSent,
      ).length;

      setIsSendingReminders(false);
      setReminderFeedback(`${count} rappel(s) envoyé(s) pour demain.`);
      setTimeout(() => setReminderFeedback(null), 3000);
    }, 1200);
  };

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handlePrevRange = () => {
    if (calendarView === 'day') {
      const newDate = subDays(selectedDate, 1);
      setSelectedDate(newDate);
      if (!isSameMonth(newDate, viewDate)) setViewDate(startOfMonth(newDate));
    } else if (calendarView === 'week') {
      const newDate = subWeeks(selectedDate, 1);
      setSelectedDate(newDate);
      if (!isSameMonth(newDate, viewDate)) setViewDate(startOfMonth(newDate));
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setViewDate(startOfMonth(newDate));
    }
  };

  const handleNextRange = () => {
    if (calendarView === 'day') {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
      if (!isSameMonth(newDate, viewDate)) setViewDate(startOfMonth(newDate));
    } else if (calendarView === 'week') {
      const newDate = addWeeks(selectedDate, 1);
      setSelectedDate(newDate);
      if (!isSameMonth(newDate, viewDate)) setViewDate(startOfMonth(newDate));
    } else {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setViewDate(startOfMonth(newDate));
    }
  };

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const filteredAppointments = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.date);

      if (selectedDoctor !== 'All' && apt.doctorName !== selectedDoctor) {
        return false;
      }

      if (calendarView === 'day') {
        return isSameDay(aptDate, selectedDate);
      }
      if (calendarView === 'week') {
        return isWithinInterval(aptDate, {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        });
      }
      return isSameMonth(aptDate, selectedDate);
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const getViewTitle = () => {
    if (calendarView === 'day') {
      return format(selectedDate, 'dd MMMM yyyy', { locale: fr });
    }
    if (calendarView === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return `Semaine du ${format(start, 'd')} au ${format(end, 'd MMMM yyyy', { locale: fr })}`;
      }
      return `Semaine du ${format(start, 'd MMMM')} au ${format(end, 'd MMMM yyyy', { locale: fr })}`;
    }
    return format(selectedDate, 'MMMM yyyy', { locale: fr });
  };

  const doctorNames = ['All', ...new Set(doctors.map((d) => d.name))];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Rendez-vous</h2>
          <p className="text-slate-500">Gérez le planning des consultations et interventions.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSendReminders}
            disabled={isSendingReminders}
            className={cn(
              'px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
              isSendingReminders ? 'opacity-50 cursor-not-allowed' : 'text-hospital-blue-600 hover:bg-hospital-blue-50',
            )}
          >
            {isSendingReminders ? <div className="w-4 h-4 border-2 border-hospital-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Send size={18} />}
            {isSendingReminders ? 'Envoi...' : 'Rappels automatiques'}
          </button>
          <button
            onClick={() => onNavigate('patients')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <User size={18} />
            Ajouter patient
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={20} />
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {reminderFeedback && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300">
          <Check size={20} />
          <p className="font-bold">{reminderFeedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{getViewTitle()}</h3>
              <div className="flex gap-1">
                <button onClick={handlePrevRange} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={20} /></button>
                <button onClick={handleNextRange} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={20} /></button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl mr-2 border border-slate-200">
                <div className="flex items-center px-3 gap-2 text-slate-500 border-r border-slate-200">
                  <Stethoscope size={14} />
                  <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer">
                    <option value="All">Tous les médecins</option>
                    {doctorNames.filter((d) => d !== 'All').map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setCalendarView('day')} className={cn('px-4 py-1.5 text-sm font-bold rounded-lg transition-all', calendarView === 'day' ? 'bg-white text-hospital-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Jour</button>
                <button onClick={() => setCalendarView('week')} className={cn('px-4 py-1.5 text-sm font-bold rounded-lg transition-all', calendarView === 'week' ? 'bg-white text-hospital-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Semaine</button>
                <button onClick={() => setCalendarView('month')} className={cn('px-4 py-1.5 text-sm font-bold rounded-lg transition-all', calendarView === 'month' ? 'bg-white text-hospital-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Mois</button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt, index) => {
                  const showDateHeader = calendarView !== 'day' && (index === 0 || filteredAppointments[index - 1].date !== apt.date);

                  return (
                    <React.Fragment key={apt.id}>
                      {showDateHeader && (
                        <div className="pt-4 pb-2 first:pt-0">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon size={14} />
                            {format(parseISO(apt.date), 'EEEE d MMMM', { locale: fr })}
                          </h4>
                        </div>
                      )}
                      <div className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 hover:border-hospital-blue-200 hover:bg-hospital-blue-50 transition-all group">
                        <div className="w-20 text-center">
                          <p className="text-lg font-bold text-slate-900">{apt.time}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">30 MIN</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{apt.patientName}</p>
                              <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase', apt.type === 'Urgence' ? 'bg-red-500/10 text-red-400' : 'bg-slate-100 text-slate-400')}>
                                {apt.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const patient = patients.find((p) => p.name.toLowerCase() === apt.patientName.toLowerCase() || p.id === apt.patientId);
                                  onSearch(patient?.name || apt.patientName);
                                  onNavigate('patients');
                                }}
                                className="p-1.5 text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                                title="Modifier patient"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const patient = patients.find((p) => p.name.toLowerCase() === apt.patientName.toLowerCase() || p.id === apt.patientId);
                                  if (patient) setArchiveConfirmation(patient.id);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Archiver patient"
                              >
                                <Archive size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const patient = patients.find((p) => p.name.toLowerCase() === apt.patientName.toLowerCase() || p.id === apt.patientId);
                                  if (patient) setDeleteConfirmation(patient.id);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Supprimer patient"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">Médecin: {apt.doctorName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {apt.reminderSent && (
                            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg" title="Rappel envoyé">
                              <Send size={12} />
                              <span className="text-[10px] font-bold uppercase">Rappelé</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const statuses: Appointment['status'][] = ['Scheduled', 'Completed', 'Cancelled'];
                              const nextStatus = statuses[(statuses.indexOf(apt.status) + 1) % statuses.length];
                              void onSaveAppointment({
                                patientId: apt.patientId || '',
                                doctorId: apt.doctorId || '',
                                date: apt.date,
                                time: apt.time,
                                type: apt.type,
                                status: nextStatus,
                                reminderSent: apt.reminderSent,
                                notes: apt.notes,
                              }, apt.id);
                            }}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80',
                              apt.status === 'Scheduled' && 'bg-blue-500/10 text-blue-400',
                              apt.status === 'Completed' && 'bg-emerald-500/10 text-emerald-400',
                              apt.status === 'Cancelled' && 'bg-red-500/10 text-red-400',
                            )}
                          >
                            {apt.status === 'Scheduled' ? 'Programmé' : apt.status === 'Completed' ? 'Terminé' : 'Annulé'}
                          </button>
                          <button onClick={() => void onDeleteAppointment(apt.id)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Supprimer RDV">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <CalendarIcon size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium">Aucun rendez-vous pour cette date.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 text-hospital-blue-600 font-bold hover:underline">
                    Planifier une consultation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{format(viewDate, 'MMMM yyyy', { locale: fr })}</h3>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] font-bold text-slate-500">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all relative',
                    !isSameMonth(day, monthStart) && 'text-slate-400',
                    isSameMonth(day, monthStart) && 'text-slate-600 hover:bg-slate-100',
                    isSameDay(day, selectedDate) && 'bg-hospital-blue-600 text-white shadow-md shadow-black/20 hover:bg-hospital-blue-700',
                    isToday(day) && !isSameDay(day, selectedDate) && 'text-hospital-blue-400 font-bold border border-hospital-blue-200',
                  )}
                >
                  {format(day, 'd')}
                  {appointments.some((apt) => isSameDay(parseISO(apt.date), day)) && (
                    <span className={cn('absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full', isSameDay(day, selectedDate) ? 'bg-white' : 'bg-hospital-blue-500')}></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-hospital-blue-600 text-white">
            <h3 className="font-bold mb-2">Statistiques du jour</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-100">Total RDV</span>
                <span className="font-bold">{appointments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-100">Terminés</span>
                <span className="font-bold">{appointments.filter((a) => a.status === 'Completed').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-100">En attente</span>
                <span className="font-bold">{appointments.filter((a) => a.status === 'Scheduled').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white">
              <h3 className="text-xl font-bold">Nouveau rendez-vous</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="text"
                    value={newApt.patientName}
                    onChange={(e) => setNewApt({ ...newApt, patientName: e.target.value })}
                    placeholder="Nom du patient"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Heure</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Type</label>
                  <select value={newApt.type} onChange={(e) => setNewApt({ ...newApt, type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all">
                    <option value="Consultation">Consultation</option>
                    <option value="Check-up">Check-up</option>
                    <option value="Urgence">Urgence</option>
                    <option value="Suivi">Suivi</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Médecin</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select value={newApt.doctorName} onChange={(e) => setNewApt({ ...newApt, doctorName: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all">
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.name}>{doc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all">
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6">Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await onDeletePatient(deleteConfirmation);
                    setDeleteConfirmation(null);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {archiveConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer l'archivage</h3>
              <p className="text-slate-500 mb-6">Êtes-vous sûr de vouloir archiver ce patient ?</p>
              <div className="flex gap-3">
                <button onClick={() => setArchiveConfirmation(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await onArchivePatient(archiveConfirmation);
                    setArchiveConfirmation(null);
                  }}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all"
                >
                  Archiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
