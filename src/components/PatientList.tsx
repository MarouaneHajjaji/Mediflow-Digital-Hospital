import React, { useState } from 'react';
import { Search, Filter, UserPlus, X, Archive, Edit2, Trash2, AlertCircle, Loader2, Download, FileText, User, Stethoscope, Activity, Phone, MapPin, Calendar as CalendarIcon, Mail } from 'lucide-react';
import { Patient, View } from '../types';
import { cn } from '../lib/utils';

interface PatientListProps {
  externalSearchTerm?: string;
  patients: Patient[];
  onNavigate: (view: View, search?: string) => void;
  onSavePatient: (patient: Partial<Patient>, patientId?: string) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  onArchivePatient: (id: string) => Promise<void>;
}

export const PatientList: React.FC<PatientListProps> = ({ 
  externalSearchTerm = '', 
  patients, 
  onNavigate,
  onSavePatient,
  onDeletePatient,
  onArchivePatient
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
  const [isSaving, setIsSaving] = useState(false);
  
  const searchTerm = externalSearchTerm || localSearchTerm;
  
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    id: '',
    name: '',
    age: 0,
    gender: 'M',
    bloodType: 'A+',
    status: 'Stable',
    room: '',
    entryDate: '',
    exitDate: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    statusDescription: '',
    medicalHistory: '',
    department: '',
    medication: '',
    dosage: '',
    freq: ''
  });

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || newPatient.age === undefined || isNaN(newPatient.age)) return;

    setIsSaving(true);
    try {
      await onSavePatient({
        ...newPatient,
        age: Number(newPatient.age),
        lastVisit: new Date().toISOString().split('T')[0],
        isArchived: false,
      }, isEditing ? newPatient.id : undefined);

      setIsModalOpen(false);
      setIsEditing(false);
      setNewPatient({ 
        id: '', 
        name: '', 
        age: 0, 
        gender: 'M', 
        bloodType: 'A+', 
        status: 'Stable', 
        room: '', 
        entryDate: '', 
        exitDate: '',
        birthDate: '',
        phone: '',
        email: '',
        address: '',
        statusDescription: '',
        medicalHistory: '',
        department: '',
        medication: '',
        dosage: '',
        freq: ''
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = (id: string) => {
    setArchiveConfirmation(id);
  };

  const confirmArchive = async () => {
    if (!archiveConfirmation) return;
    await onArchivePatient(archiveConfirmation);
    setArchiveConfirmation(null);
  };

  const handleEdit = (patient: Patient) => {
    setNewPatient(patient);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    await onDeletePatient(deleteConfirmation);
    setDeleteConfirmation(null);
  };

  const handleExportCSV = () => {
    if (filteredPatients.length === 0) return;

    const headers = ["ID", "Nom", "Age", "Genre", "Groupe sanguin", "Dernière Visite", "Statut", "Chambre"];
    const rows = filteredPatients.map(p => [
      `"${p.id}"`,
      `"${p.name}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.bloodType}"`,
      `"${p.lastVisit}"`,
      `"${p.status}"`,
      `"${p.room || ''}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPatients = patients
    .filter(p => 
      !p.isArchived && (
        searchTerm === 'status:Critical'
          ? p.status === 'Critical'
          : (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.id.includes(searchTerm) ||
            (p.patientCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'age') return b.age - a.age;
      if (sortBy === 'lastVisit') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestion des patients</h2>
          <p className="text-slate-500">Consultez et gérez les dossiers de vos patients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <UserPlus size={20} />
          Ajouter un patient
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un patient par nom, ID..." 
                value={searchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all text-slate-900"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-10 pr-8 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="name">Trier par Nom</option>
                <option value="age">Trier par Âge</option>
                <option value="lastVisit">Dernière Visite</option>
              </select>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Âge / Genre</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Département</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Groupe sanguin</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dernière Visite</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-hospital-blue-100 text-hospital-blue-600 flex items-center justify-center font-bold border border-hospital-blue-200">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-400">ID: #{patient.id.padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">{patient.age} ans, {patient.gender}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">{patient.department || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold">
                      {patient.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500">{patient.lastVisit}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      patient.status === 'Stable' && "bg-emerald-500/10 text-emerald-400",
                      patient.status === 'Recovering' && "bg-blue-500/10 text-blue-400",
                      (patient.status === 'Critical' || (patient.status as string) === 'Critique') && "bg-red-500/10 text-red-400"
                    )}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onNavigate('emr', patient.name)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Voir EMR"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(patient)}
                        className="p-2 text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleArchive(patient.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Archiver"
                      >
                        <Archive size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(patient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucun patient trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white">
              <h3 className="text-xl font-bold">{isEditing ? 'Modifier le patient' : 'Nouveau patient'}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                  setNewPatient({ 
                    id: '', 
                    name: '', 
                    age: 0, 
                    gender: 'M', 
                    bloodType: 'A+', 
                    status: 'Stable', 
                    room: '',
                    entryDate: '',
                    exitDate: '',
                    birthDate: '',
                    phone: '',
                    email: '',
                    address: '',
                    statusDescription: '',
                    medicalHistory: '',
                    department: '',
                    medication: '',
                    dosage: '',
                    freq: ''
                  });
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Section 1: Informations Personnelles */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User size={18} className="text-hospital-blue-600" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informations Personnelles</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">ID {isEditing ? '' : '(Optionnel)'}</label>
                    <input 
                      type="text" 
                      value={newPatient.id}
                      onChange={(e) => setNewPatient({...newPatient, id: e.target.value})}
                      placeholder="ex: 1234"
                      disabled={isEditing}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Nom complet</label>
                    <input 
                      required
                      type="text" 
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                      placeholder="ex: Ahmed Alaoui"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <CalendarIcon size={14} className="text-slate-400" />
                      Date de Naissance
                    </label>
                    <input 
                      type="date" 
                      value={newPatient.birthDate || ''}
                      onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      Téléphone
                    </label>
                    <input 
                      type="tel" 
                      value={newPatient.phone || ''}
                      onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                      placeholder="ex: 06 12 34 56 78"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      Email
                    </label>
                    <input 
                      type="email" 
                      value={newPatient.email || ''}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      placeholder="ex: ahmed.alaoui@patient.mediflow.ma"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    Adresse
                  </label>
                  <textarea 
                    value={newPatient.address || ''}
                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                    placeholder="ex: 123 Rue de la Santé, Paris"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Historique médical</label>
                    <textarea 
                      value={newPatient.medicalHistory || ''}
                      onChange={(e) => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                      placeholder="Antécédents, allergies, traitements et hospitalisations..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Âge</label>
                    <input 
                      required
                      type="number" 
                      value={newPatient.age || ''}
                      onChange={(e) => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                      placeholder="ex: 45"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Genre</label>
                    <select 
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value as 'M' | 'F'})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Informations Médicales */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Stethoscope size={18} className="text-hospital-blue-600" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informations Médicales</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Groupe sanguin</label>
                    <select 
                      value={newPatient.bloodType}
                      onChange={(e) => setNewPatient({...newPatient, bloodType: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Département</label>
                    <input 
                      type="text" 
                      value={newPatient.department || ''}
                      onChange={(e) => setNewPatient({...newPatient, department: e.target.value})}
                      placeholder="ex: Cardiologie"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Médicament actuel</label>
                  <input 
                    type="text" 
                    value={newPatient.medication || ''}
                    onChange={(e) => setNewPatient({...newPatient, medication: e.target.value})}
                    placeholder="ex: Paracétamol"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dosage</label>
                    <input 
                      type="text" 
                      value={newPatient.dosage || ''}
                      onChange={(e) => setNewPatient({...newPatient, dosage: e.target.value})}
                      placeholder="ex: 500mg"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Fréquence</label>
                    <input 
                      type="text" 
                      value={newPatient.freq || ''}
                      onChange={(e) => setNewPatient({...newPatient, freq: e.target.value})}
                      placeholder="ex: 3x / jour"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Suivi & Hospitalisation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Activity size={18} className="text-hospital-blue-600" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Suivi & Hospitalisation</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Chambre / Unité</label>
                    <input 
                      type="text" 
                      value={newPatient.room}
                      onChange={(e) => setNewPatient({...newPatient, room: e.target.value})}
                      placeholder="ex: 101A"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Statut</label>
                    <select 
                      value={newPatient.status}
                      onChange={(e) => setNewPatient({...newPatient, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    >
                      <option value="Stable">Stable</option>
                      <option value="Recovering">En convalescence</option>
                      <option value="Critical">Critique (URGENCE)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Description de l'état</label>
                  <textarea 
                    value={newPatient.statusDescription || ''}
                    onChange={(e) => setNewPatient({...newPatient, statusDescription: e.target.value})}
                    placeholder="Détails sur l'état actuel du patient..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date d'entrée</label>
                    <input 
                      type="date" 
                      value={newPatient.entryDate || ''}
                      onChange={(e) => setNewPatient({...newPatient, entryDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date de sortie (Prévue)</label>
                    <input 
                      type="date" 
                      value={newPatient.exitDate || ''}
                      onChange={(e) => setNewPatient({...newPatient, exitDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditing(false);
                    setNewPatient({ 
                      id: '', 
                      name: '', 
                      age: 0, 
                      gender: 'M', 
                      bloodType: 'A+', 
                      status: 'Stable', 
                      room: '', 
                      entryDate: '', 
                    exitDate: '',
                    birthDate: '',
                    phone: '',
                    email: '',
                    address: '',
                    statusDescription: '',
                    medicalHistory: '',
                    department: '',
                    medication: '',
                      dosage: '',
                      freq: ''
                    });
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 size={18} className="animate-spin" />}
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6">
                Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible et supprimera toutes les données associées.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Archive Confirmation Modal */}
      {archiveConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer l'archivage</h3>
              <p className="text-slate-500 mb-6">
                Êtes-vous sûr de vouloir archiver ce patient ? Il ne sera plus visible dans la liste active mais pourra être consulté dans les archives.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setArchiveConfirmation(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmArchive}
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



