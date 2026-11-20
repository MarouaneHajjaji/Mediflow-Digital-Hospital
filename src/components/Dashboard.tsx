import React from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

import { DashboardSummary, Patient, View } from '../types';
import { cn } from '../lib/utils';

const data = [
  { name: 'Lun', patients: 45 },
  { name: 'Mar', patients: 52 },
  { name: 'Mer', patients: 38 },
  { name: 'Jeu', patients: 65 },
  { name: 'Ven', patients: 48 },
  { name: 'Sam', patients: 25 },
  { name: 'Dim', patients: 15 },
];

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'alert';
}

interface DashboardProps {
  patients: Patient[];
  notifications: DashboardNotification[];
  summary: DashboardSummary;
  currentDoctorName?: string;
  currentSpecialty?: string;
  onNavigate: (view: View, search?: string) => void;
  onSearch: (term: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  notifications,
  summary,
  currentDoctorName,
  currentSpecialty,
  onNavigate,
  onSearch,
}) => {
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);

  const handleExportReport = () => {
    if (patients.length === 0) return;

    const headers = ['ID', 'Nom', 'Age', 'Genre', 'Groupe Sanguin', 'Statut', 'Chambre', 'Date Entree', 'Telephone'];
    const rows = patients.map((patient) => [
      `"${patient.id}"`,
      `"${patient.name}"`,
      patient.age,
      `"${patient.gender}"`,
      `"${patient.bloodType}"`,
      `"${patient.status}"`,
      `"${patient.room || ''}"`,
      `"${patient.entryDate || ''}"`,
      `"${patient.phone || ''}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_patients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'Total Patients', value: summary.patientsTotal.toLocaleString(), icon: Users, color: 'bg-blue-500', trend: 'Patients' },
    { label: 'Rendez-vous', value: summary.appointmentsToday.toLocaleString(), icon: Calendar, color: 'bg-indigo-500', trend: "Aujourd'hui" },
    { label: 'Urgences', value: summary.criticalPatients.toString(), icon: AlertCircle, color: 'bg-red-500', trend: 'Actives' },
    { label: 'Revenus', value: `${summary.revenueTotal.toLocaleString('fr-FR')} DH`, icon: TrendingUp, color: 'bg-amber-500', trend: 'Facturation' },
  ];

  const recentActivities = notifications.slice(0, 5).map((notification) => ({
    id: notification.id,
    patient: notification.title,
    message: notification.message,
    time: notification.time,
    status: notification.type === 'alert' ? 'alert' : notification.type === 'success' ? 'success' : 'pending',
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Tableau de bord</h2>
          <p className="text-slate-500">
            Bienvenue, {currentDoctorName || 'medecin'}. Voici l apercu d aujourd hui{currentSpecialty ? ` pour ${currentSpecialty}` : ''}.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Exporter le rapport
          </button>
          <button
            onClick={() => onNavigate('patients')}
            className="btn-primary"
          >
            Nouveau Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'card p-6 flex items-center gap-4 transition-all',
              stat.label === 'Urgences' && 'cursor-pointer hover:shadow-lg hover:border-red-100',
            )}
            onClick={() => {
              if (stat.label === 'Urgences') {
                onSearch('status:Critical');
                onNavigate('patients', 'status:Critical');
              }
            }}
          >
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-black/20`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <span className="text-xs font-bold text-slate-500">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Frequentation des Patients</h3>
            <select className="bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-600 px-3 py-1 outline-none">
              <option>Cette semaine</option>
              <option>Ce mois</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Activite Recente</h3>
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  {activity.status === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {activity.status === 'pending' && <Clock size={18} className="text-amber-500" />}
                  {activity.status === 'alert' && <AlertCircle size={18} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{activity.patient}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{activity.message}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase shrink-0">{activity.time}</span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="py-10 text-center">
                <Clock size={32} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">Aucune activite recente</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="w-full mt-8 py-2 text-sm font-bold text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-xl transition-colors"
          >
            Voir tout l historique
          </button>
        </div>
      </div>

      {showHistoryModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-hospital-blue-50 text-hospital-blue-600 rounded-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Historique des Activites</h3>
                  <p className="text-xs text-slate-500">Journal complet des evenements recents.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">
                {notifications.map((notification, index) => (
                  <div key={notification.id} className="flex gap-4 relative">
                    {index !== notifications.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-slate-100"></div>
                    )}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 z-10',
                        notification.type === 'alert'
                          ? 'bg-red-100 text-red-600'
                          : notification.type === 'success'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-hospital-blue-100 text-hospital-blue-600',
                      )}
                    >
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{notification.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="py-20 text-center">
                    <Clock size={48} className="mx-auto mb-4 text-slate-100" />
                    <p className="text-slate-400 font-medium">L historique est vide pour le moment.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
