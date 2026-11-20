import React from 'react';
import {
  Shield,
  Users,
  Calendar,
  Stethoscope,
  AlertCircle,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { Appointment, Doctor, Patient, View } from '../types';
import { cn } from '../lib/utils';

interface AdminViewProps {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  notifications: Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'alert'; time: string }>;
  onNavigate: (view: View, search?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ doctors, patients, appointments, notifications, onNavigate }) => {
  const criticalPatients = patients.filter((patient) => patient.status === 'Critical');
  const topSpecialties = Object.entries(
    patients.reduce<Record<string, number>>((acc, patient) => {
      const key = patient.department || 'Non assigne';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const stats = [
    { label: 'Medecins actifs', value: doctors.length, icon: Stethoscope, color: 'bg-hospital-blue-600' },
    { label: 'Patients totaux', value: patients.length, icon: Users, color: 'bg-emerald-600' },
    { label: 'Rendez-vous', value: appointments.length, icon: Calendar, color: 'bg-amber-500' },
    { label: 'Cas critiques', value: criticalPatients.length, icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest mb-3">
            <Shield size={14} />
            Espace Admin
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Administration</h2>
          <p className="text-slate-500">Vue globale de l'hopital, des medecins, des patients et des alertes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('settings')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Gerer les medecins
          </button>
          <button onClick={() => onNavigate('patients')} className="btn-primary">
            Voir tous les patients
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6 flex items-center gap-4">
            <div className={cn('p-3 rounded-2xl text-white shadow-lg shadow-black/10', stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Specialites et repartition</h3>
            <button onClick={() => onNavigate('settings')} className="text-sm font-bold text-hospital-blue-600 hover:underline">
              Ouvrir les parametres
            </button>
          </div>
          <div className="space-y-4">
            {topSpecialties.map(([specialty, count]) => (
              <div key={specialty} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-slate-900">{specialty}</p>
                  <span className="text-sm font-bold text-slate-500">{count} patient(s)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-hospital-blue-600 rounded-full" style={{ width: `${Math.max((count / Math.max(patients.length, 1)) * 100, 8)}%` }} />
                </div>
              </div>
            ))}
            {topSpecialties.length === 0 && <p className="text-sm text-slate-400">Aucune donnee de specialite disponible.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Alertes recentes</h3>
          <div className="space-y-4">
            {notifications.slice(0, 6).map((notification) => (
              <div key={notification.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                  </div>
                  <span className={cn(
                    'mt-0.5 inline-flex h-2.5 w-2.5 rounded-full',
                    notification.type === 'alert' ? 'bg-red-500' : notification.type === 'success' ? 'bg-emerald-500' : 'bg-hospital-blue-500',
                  )} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3">{notification.time}</p>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-sm text-slate-400">Aucune notification pour le moment.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 text-slate-900">
            <Activity size={18} className="text-hospital-blue-600" />
            <h3 className="text-lg font-bold">Cas critiques a traiter</h3>
          </div>
          <div className="space-y-3">
            {criticalPatients.slice(0, 5).map((patient) => (
              <button
                key={patient.id}
                onClick={() => onNavigate('patients', patient.name)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-slate-900">{patient.name}</p>
                  <p className="text-xs text-slate-500">{patient.department || 'Sans specialite'} | Chambre {patient.room || 'N/A'}</p>
                </div>
                <ChevronRight size={16} className="text-red-500" />
              </button>
            ))}
            {criticalPatients.length === 0 && <p className="text-sm text-slate-400">Aucun patient critique actuellement.</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 text-slate-900">
            <Stethoscope size={18} className="text-hospital-blue-600" />
            <h3 className="text-lg font-bold">Equipe medicale</h3>
          </div>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">{doctor.name}</p>
                  <p className="text-xs text-slate-500">{doctor.specialty}</p>
                  <p className="text-[11px] text-slate-400">{doctor.department || 'Departement non renseigne'}</p>
                  <p className="text-[11px] text-slate-400">{doctor.email || 'Email non renseigne'} {doctor.availability ? `• ${doctor.availability}` : ''}</p>
                </div>
                <button onClick={() => onNavigate('settings')} className="text-sm font-bold text-hospital-blue-600 hover:underline">
                  Gerer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
