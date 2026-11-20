import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Stethoscope,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Pencil,
  AlertTriangle,
  Check,
  Upload,
  Image as ImageIcon,
  Download,
  Moon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Doctor, Patient, Appointment } from '../types';

type SettingsTab = 'profile' | 'doctors' | 'notifications' | 'security' | 'language' | 'data';

type SettingsIconComponent = React.ComponentType<{ size?: number; className?: string }>;

type TabConfig = {
  key: SettingsTab;
  Icon: SettingsIconComponent;
  label: string;
};

type NotificationPreferenceKey = 'pushNotifications' | 'emailAlerts';

type NotificationPreferenceConfig = {
  key: NotificationPreferenceKey;
  Icon: SettingsIconComponent;
  title: string;
  desc: string;
};

const SETTINGS_TABS: TabConfig[] = [
  { key: 'profile', Icon: User, label: 'Profil utilisateur' },
  { key: 'doctors', Icon: Stethoscope, label: 'Gestion des mÃ©decins' },
  { key: 'notifications', Icon: Bell, label: 'Notifications' },
  { key: 'security', Icon: Shield, label: 'SÃ©curitÃ©' },
  { key: 'language', Icon: Globe, label: 'Langue & rÃ©gion' },
  { key: 'data', Icon: Database, label: 'DonnÃ©es & sauvegarde' },
];

const NOTIFICATION_PREFERENCES: NotificationPreferenceConfig[] = [
  { key: 'pushNotifications', Icon: Bell, title: 'Notifications push', desc: 'Alertes en temps rÃ©el sur le bureau.' },
  { key: 'emailAlerts', Icon: Globe, title: 'Alertes email', desc: 'Rapports quotidiens et alertes critiques.' },
];

interface SettingsViewProps {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  notifications: any[];
  onSaveDoctor: (doctor: Omit<Doctor, 'id'>, doctorId?: string) => Promise<void>;
  onDeleteDoctor: (id: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  doctors,
  patients,
  appointments,
  notifications,
  onSaveDoctor,
  onDeleteDoctor,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', age: '', profilePic: '', email: '', department: '', availability: '' });
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState("Aujourd'hui à 04:30");

  const [userProfile, setUserProfile] = useState({
    firstName: 'Nadia',
    lastName: 'El Mansouri',
    email: 'admin@mediflow.com',
    profilePic: '',
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    pushNotifications: true,
    emailAlerts: true,
    language: 'Français',
    timezone: 'UTC+1 (Casablanca)',
    twoFactor: false,
  });

  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'doctor' | 'profile' | 'editDoctor') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'editDoctor' && editingDoctor) {
        setEditingDoctor({ ...editingDoctor, profilePic: base64String });
      } else if (target === 'profile') {
        setUserProfile({ ...userProfile, profilePic: base64String });
      } else {
        setNewDoctor({ ...newDoctor, profilePic: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetDoctorForm = () => {
    setNewDoctor({ name: '', specialty: '', age: '', profilePic: '', email: '', department: '', availability: '' });
    setShowAddDoctor(false);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.age) return;

    setIsSavingDoctor(true);
    await onSaveDoctor({
      name: newDoctor.name.startsWith('Dr. ') ? newDoctor.name : `Dr. ${newDoctor.name}`,
      specialty: newDoctor.specialty,
      age: Number(newDoctor.age),
      profilePic: newDoctor.profilePic || undefined,
      email: newDoctor.email || undefined,
      department: newDoctor.department || undefined,
      availability: newDoctor.availability || undefined,
    });
    setIsSavingDoctor(false);
    resetDoctorForm();
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || !editingDoctor.name || !editingDoctor.specialty || !editingDoctor.age) return;

    setIsSavingDoctor(true);
    await onSaveDoctor({
      name: editingDoctor.name.startsWith('Dr. ') ? editingDoctor.name : `Dr. ${editingDoctor.name}`,
      specialty: editingDoctor.specialty,
      age: Number(editingDoctor.age),
      profilePic: editingDoctor.profilePic,
      email: editingDoctor.email,
      department: editingDoctor.department,
      availability: editingDoctor.availability,
    }, editingDoctor.id);
    setIsSavingDoctor(false);
    setEditingDoctor(null);
  };

  const handleCloudBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setLastBackupDate(`Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    }, 1500);
  };

  const handleExportAllData = () => {
    const fullData = {
      patients,
      doctors,
      appointments,
      notifications,
      systemPreferences: preferences,
      userProfile,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mediflow_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredDoctors = doctors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Paramètres</h2>
        <p className="text-slate-500">Gérez vos préférences et la configuration du système.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-2">
            {([
              ['profile', User, 'Profil utilisateur'],
              ['doctors', Stethoscope, 'Gestion des médecins'],
              ['notifications', Bell, 'Notifications'],
              ['security', Shield, 'Sécurité'],
              ['language', Globe, 'Langue & région'],
              ['data', Database, 'Données & sauvegarde'],
            ] as [SettingsTab, SettingsIconComponent, string][]).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all',
                  activeTab === key ? 'bg-hospital-blue-50 text-hospital-blue-600' : 'text-slate-600 hover:bg-slate-50 font-medium',
                )}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'profile' && (
            <>
              <div className="card p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Profil personnel</h3>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-hospital-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-hospital-blue-100 overflow-hidden">
                    {userProfile.profilePic ? <img src={userProfile.profilePic} alt="Profile" className="w-full h-full object-cover" /> : userProfile.firstName[0]}
                  </div>
                  <div>
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 bg-hospital-blue-50 text-hospital-blue-600 rounded-xl text-sm font-bold hover:bg-hospital-blue-100 transition-all">
                        Changer la photo
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <input type="text" value={userProfile.firstName} onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                  <input type="text" value={userProfile.lastName} onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                  <input type="email" value={userProfile.email} onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })} className="col-span-2 w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                </div>
              </div>

              <div className="card p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Préférences système</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <Moon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Mode sombre</p>
                      <p className="text-xs text-slate-500">Ajuster l'apparence de l'interface.</p>
                    </div>
                  </div>
                  <button onClick={() => handlePreferenceToggle('darkMode')} className={cn('w-12 h-6 rounded-full relative transition-all', preferences.darkMode ? 'bg-hospital-blue-600' : 'bg-slate-200')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all', preferences.darkMode ? 'right-1' : 'left-1')}></div>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'doctors' && (
            <div className="card p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-900">Gestion des médecins</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher un médecin..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowAddDoctor(!showAddDoctor);
                      setEditingDoctor(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-hospital-blue-600 text-white rounded-xl text-sm font-bold hover:bg-hospital-blue-700 transition-all shrink-0"
                  >
                    {showAddDoctor ? <X size={18} /> : <Plus size={18} />}
                    {showAddDoctor ? 'Annuler' : 'Ajouter'}
                  </button>
                </div>
              </div>

              {showAddDoctor && (
                <form onSubmit={handleAddDoctor} className="mb-8 p-6 bg-slate-50 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="text" value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} placeholder="Nom du médecin" className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <input required type="text" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} placeholder="Spécialité" className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <input required type="number" value={newDoctor.age} onChange={(e) => setNewDoctor({ ...newDoctor, age: e.target.value })} placeholder="Âge" className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {newDoctor.profilePic ? <img src={newDoctor.profilePic} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                          <Upload size={14} />
                          Importer une image
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'doctor')} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isSavingDoctor} className="btn-primary">
                      <Save size={18} />
                      {isSavingDoctor ? 'Enregistrement...' : 'Enregistrer le médecin'}
                    </button>
                  </div>
                </form>
              )}

              {editingDoctor && (
                <form onSubmit={handleUpdateDoctor} className="mb-8 p-6 bg-hospital-blue-50/50 border border-hospital-blue-100 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-hospital-blue-600 uppercase tracking-widest">Modifier le médecin</h4>
                    <button type="button" onClick={() => setEditingDoctor(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="text" value={editingDoctor.name} onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <input required type="text" value={editingDoctor.specialty} onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <input required type="number" value={editingDoctor.age} onChange={(e) => setEditingDoctor({ ...editingDoctor, age: Number(e.target.value) })} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {editingDoctor.profilePic ? <img src={editingDoctor.profilePic} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                          <Upload size={14} />
                          Changer l'image
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'editDoctor')} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingDoctor(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                      Annuler
                    </button>
                    <button type="submit" disabled={isSavingDoctor} className="btn-primary">
                      <Check size={18} />
                      {isSavingDoctor ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-hospital-blue-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-hospital-blue-50 overflow-hidden flex items-center justify-center border border-slate-100">
                        {doctor.profilePic ? <img src={doctor.profilePic} alt={doctor.name} className="w-full h-full object-cover" /> : <Stethoscope size={24} className="text-hospital-blue-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{doctor.name}</p>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">{doctor.age} ans</span>
                        </div>
                        <p className="text-xs text-slate-500">{doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingDoctor(doctor); setShowAddDoctor(false); }} className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" title="Modifier">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => setDoctorToDelete(doctor)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Préférences de notifications</h3>
              <div className="space-y-6">
                {([
                  ['pushNotifications', Bell, 'Notifications push', 'Alertes en temps réel sur le bureau.'],
                  ['emailAlerts', Globe, 'Alertes email', 'Rapports quotidiens et alertes critiques.'],
                ] as [NotificationPreferenceKey, SettingsIconComponent, string, string][]).map(([key, Icon, title, desc]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-hospital-blue-100 text-hospital-blue-600 rounded-lg">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <button onClick={() => handlePreferenceToggle(key)} className={cn('w-12 h-6 rounded-full relative transition-all', preferences[key] ? 'bg-hospital-blue-600' : 'bg-slate-300')}>
                      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all', preferences[key] ? 'right-1' : 'left-1')}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Sécurité du compte</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-900">Authentification à deux facteurs</p>
                    <p className="text-xs text-slate-500">Ajoutez une couche de sécurité supplémentaire.</p>
                  </div>
                  <button onClick={() => handlePreferenceToggle('twoFactor')} className={cn('w-12 h-6 rounded-full relative transition-all', preferences.twoFactor ? 'bg-amber-600' : 'bg-slate-300')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all', preferences.twoFactor ? 'right-1' : 'left-1')}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Langue & région</h3>
              <div className="space-y-6">
                <select value={preferences.language} onChange={(e) => setPreferences({ ...preferences, language: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500">
                  <option value="Français">Français</option>
                  <option value="English">English</option>
                  <option value="العربية">العربية</option>
                </select>
                <select value={preferences.timezone} onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500">
                  <option value="UTC+1 (Casablanca)">UTC+1 (Casablanca)</option>
                  <option value="UTC+1 (Paris)">UTC+1 (Paris)</option>
                  <option value="UTC+0 (London)">UTC+0 (London)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Données & sauvegarde</h3>
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Sauvegarde cloud</p>
                    <p className="text-xs text-slate-500">Dernière sauvegarde : {lastBackupDate}</p>
                  </div>
                  <button onClick={handleCloudBackup} disabled={isBackingUp} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                    {isBackingUp ? 'Sauvegarde...' : 'Sauvegarder maintenant'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={handleExportAllData} className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Download size={18} />
                    Exporter toutes les données
                  </button>
                  <button onClick={() => setShowClearCacheModal(true)} className="flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-100 transition-all">
                    <Trash2 size={18} />
                    Effacer le cache local
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {doctorToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDoctorToDelete(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDoctorToDelete(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-lg font-bold">Confirmer la suppression</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le <strong>{doctorToDelete.name}</strong> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDoctorToDelete(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                Annuler
              </button>
              <button
                onClick={async () => {
                  await onDeleteDoctor(doctorToDelete.id);
                  setDoctorToDelete(null);
                }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearCacheModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setShowClearCacheModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-lg font-bold">Effacer le cache ?</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Cette action supprimera les données temporaires stockées localement.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearCacheModal(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowClearCacheModal(false);
                  window.location.reload();
                }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
