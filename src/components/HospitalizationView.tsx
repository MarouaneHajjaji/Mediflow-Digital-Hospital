import React, { useState } from 'react';
import { 
  Bed, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Activity,
  Heart,
  Thermometer,
  Wind,
  History,
  X,
  Save,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Patient } from '../types';

interface VitalMeasurement {
  id: string;
  timestamp: string;
  pulse: number;
  temperature: number;
  bloodPressure: string;
  oxygenSaturation: number;
}

interface Hospitalization {
  id: string;
  patient: string;
  room: string;
  admissionDate: string;
  status: 'Critical' | 'Recovering' | 'Stable';
  vitalsHistory: VitalMeasurement[];
}

const initialHospitalizations: Hospitalization[] = [
  { 
    id: 'H-101', 
    patient: 'Omar Tazi', 
    room: '101A', 
    admissionDate: '2026-05-15', 
    status: 'Critical', 
    vitalsHistory: [
      { id: 'v1', timestamp: '2026-04-06T08:00:00', pulse: 110, temperature: 38.5, bloodPressure: '140/90', oxygenSaturation: 94 },
      { id: 'v2', timestamp: '2026-04-06T10:00:00', pulse: 105, temperature: 38.2, bloodPressure: '135/85', oxygenSaturation: 95 },
    ]
  },
  { 
    id: 'H-204', 
    patient: 'Fatima Zahra Idrissi', 
    room: '204', 
    admissionDate: '2026-05-08', 
    status: 'Recovering', 
    vitalsHistory: [
      { id: 'v3', timestamp: '2026-04-06T09:00:00', pulse: 72, temperature: 36.8, bloodPressure: '120/80', oxygenSaturation: 98 },
    ]
  },
  { 
    id: 'H-105', 
    patient: 'Ahmed Alaoui', 
    room: '105B', 
    admissionDate: '2026-05-12', 
    status: 'Stable', 
    vitalsHistory: [
      { id: 'v4', timestamp: '2026-04-06T07:30:00', pulse: 80, temperature: 37.2, bloodPressure: '125/82', oxygenSaturation: 97 },
    ]
  },
];

interface HospitalizationViewProps {
  patients: Patient[];
}

export const HospitalizationView: React.FC<HospitalizationViewProps> = ({ patients }) => {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>(initialHospitalizations);
  const [selectedPatient, setSelectedPatient] = useState<Hospitalization | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddAdmission, setShowAddAdmission] = useState(false);
  
  // Form state for new vitals
  const [newVitals, setNewVitals] = useState({
    pulse: '',
    temperature: '',
    bloodPressure: '',
    oxygenSaturation: ''
  });

  // Form state for new admission
  const [newAdmission, setNewAdmission] = useState({
    patientName: '',
    patientCIN: '',
    room: '',
    status: 'Stable' as 'Stable' | 'Recovering' | 'Critical',
    pulse: '',
    temperature: '',
    bloodPressure: '',
    oxygenSaturation: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Critical' | 'Recovering' | 'Stable'>('All');

  const filteredHospitalizations = hospitalizations.filter(h => {
    const belongsToVisiblePatient = patients.some(patient => patient.name === h.patient);
    if (!belongsToVisiblePatient) return false;

    const statusLabel = h.status === 'Critical' ? 'critique' : h.status === 'Recovering' ? 'en convalescence' : 'stable';
    const matchesSearch = h.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         h.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         statusLabel.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmission.patientName || !newAdmission.patientCIN) return;

    const vitals: VitalMeasurement[] = [];
    if (newAdmission.pulse || newAdmission.temperature || newAdmission.bloodPressure || newAdmission.oxygenSaturation) {
      vitals.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        pulse: Number(newAdmission.pulse) || 0,
        temperature: Number(newAdmission.temperature) || 0,
        bloodPressure: newAdmission.bloodPressure || 'N/A',
        oxygenSaturation: Number(newAdmission.oxygenSaturation) || 0
      });
    }

    const admission: Hospitalization = {
      id: `H-${Math.floor(Math.random() * 900) + 100}`,
      patient: `${newAdmission.patientName} (CIN: ${newAdmission.patientCIN})`,
      room: newAdmission.room,
      admissionDate: new Date().toISOString().split('T')[0],
      status: newAdmission.status,
      vitalsHistory: vitals
    };

    setHospitalizations([admission, ...hospitalizations]);
    setShowAddAdmission(false);
    setNewAdmission({ 
      patientName: '',
      patientCIN: '',
      room: '', 
      status: 'Stable',
      pulse: '',
      temperature: '',
      bloodPressure: '',
      oxygenSaturation: ''
    });
  };

  const handleAddVitals = () => {
    if (!selectedPatient) return;

    const measurement: VitalMeasurement = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      pulse: Number(newVitals.pulse),
      temperature: Number(newVitals.temperature),
      bloodPressure: newVitals.bloodPressure,
      oxygenSaturation: Number(newVitals.oxygenSaturation)
    };

    setHospitalizations(prev => prev.map(h => 
      h.id === selectedPatient.id 
        ? { ...h, vitalsHistory: [measurement, ...h.vitalsHistory] }
        : h
    ));

    setShowAddVitals(false);
    setNewVitals({ pulse: '', temperature: '', bloodPressure: '', oxygenSaturation: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Hospitalisation</h2>
          <p className="text-slate-500">Suivi des lits, chambres et patients hospitalisés.</p>
        </div>
        <button 
          onClick={() => setShowAddAdmission(true)}
          className="btn-primary"
        >
          <Plus size={20} />
          Nouvelle Admission
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Lits Occupés</p>
            <h3 className="text-2xl font-bold text-slate-900">{hospitalizations.length} / 50</h3>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-hospital-blue-100 border-t-hospital-blue-600 flex items-center justify-center">
            <span className="text-xs font-bold text-hospital-blue-600">{Math.round((hospitalizations.length / 50) * 100)}%</span>
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Sorties Prévues</p>
            <h3 className="text-2xl font-bold text-slate-900">{hospitalizations.filter(h => h.status === 'Stable').length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity size={24} />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Urgences / Soins Intensifs</p>
            <h3 className="text-2xl font-bold text-slate-900">{hospitalizations.filter(h => h.status === 'Critical').length}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <AlertCircle size={24} className="animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par patient, chambre ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:border-hospital-blue-500 transition-all">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
            >
              <option value="All">Tous les statuts</option>
              <option value="Critical">Critique</option>
              <option value="Recovering">En convalescence</option>
              <option value="Stable">Stable</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHospitalizations.map((h) => (
          <div key={h.id} className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                  h.status === 'Critical' ? "bg-red-500 shadow-red-100" : 
                  h.status === 'Recovering' ? "bg-blue-500 shadow-blue-100" : "bg-emerald-500 shadow-emerald-100"
                )}>
                  <Bed size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{h.patient}</h4>
                  <p className="text-xs text-slate-500">Chambre {h.room}</p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                h.status === 'Critical' ? "bg-red-50 text-red-600" : 
                h.status === 'Recovering' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {h.status === 'Critical' ? 'Critique' : h.status === 'Recovering' ? 'En convalescence' : 'Stable'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {h.vitalsHistory.length > 0 ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-red-500">
                      <Heart size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pouls</p>
                      <p className="font-bold text-slate-900">{h.vitalsHistory[0].pulse} BPM</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-amber-500">
                      <Thermometer size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Température</p>
                      <p className="font-bold text-slate-900">{h.vitalsHistory[0].temperature}°C</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-blue-500">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tension</p>
                      <p className="font-bold text-slate-900">{h.vitalsHistory[0].bloodPressure}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-500">
                      <Wind size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">SpO2</p>
                      <p className="font-bold text-slate-900">{h.vitalsHistory[0].oxygenSaturation}%</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 bg-slate-50 p-4 rounded-2xl text-center text-slate-400 text-xs italic">
                  Aucune constante enregistrée
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedPatient(h);
                  setShowHistory(true);
                }}
                className="flex-1 py-2 bg-hospital-blue-600 text-white rounded-xl text-xs font-bold hover:bg-hospital-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <History size={14} />
                Historique
              </button>
              <button 
                onClick={() => {
                  setSelectedPatient(h);
                  setShowAddVitals(true);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                Mesurer
              </button>
            </div>
          </div>
        ))}
        {filteredHospitalizations.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-100 border-dashed">
            Aucune hospitalisation trouvée pour "{searchTerm}" avec le filtre actuel.
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Historique des Constantes</h3>
                <p className="text-sm text-slate-500">{selectedPatient.patient}</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedPatient.vitalsHistory.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-hospital-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs font-bold">
                          {format(new Date(v.timestamp), 'dd MMMM yyyy HH:mm', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pouls</p>
                        <p className="font-bold text-slate-900 text-sm">{v.pulse} BPM</p>
                      </div>
                      <div className="text-center border-l border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Temp</p>
                        <p className="font-bold text-slate-900 text-sm">{v.temperature}°C</p>
                      </div>
                      <div className="text-center border-l border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tension</p>
                        <p className="font-bold text-slate-900 text-sm">{v.bloodPressure}</p>
                      </div>
                      <div className="text-center border-l border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">SpO2</p>
                        <p className="font-bold text-slate-900 text-sm">{v.oxygenSaturation}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vitals Modal */}
      {showAddVitals && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Nouvelles Mesures</h3>
              <button 
                onClick={() => setShowAddVitals(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Pouls (BPM)</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      value={newVitals.pulse}
                      onChange={(e) => setNewVitals({...newVitals, pulse: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                      placeholder="Ex: 75"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Température (°C)</label>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      step="0.1"
                      value={newVitals.temperature}
                      onChange={(e) => setNewVitals({...newVitals, temperature: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                      placeholder="Ex: 37.2"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tension (mmHg)</label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={newVitals.bloodPressure}
                      onChange={(e) => setNewVitals({...newVitals, bloodPressure: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                      placeholder="Ex: 120/80"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Saturation (%)</label>
                  <div className="relative">
                    <Wind className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      value={newVitals.oxygenSaturation}
                      onChange={(e) => setNewVitals({...newVitals, oxygenSaturation: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                      placeholder="Ex: 98"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleAddVitals}
                className="w-full py-3 bg-hospital-blue-600 text-white rounded-2xl font-bold hover:bg-hospital-blue-700 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Save size={20} />
                Enregistrer les Mesures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admission Modal */}
      {showAddAdmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Nouvelle Admission</h3>
              <button 
                onClick={() => setShowAddAdmission(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddAdmission} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nom Complet du Patient</label>
                <input 
                  required
                  type="text"
                  value={newAdmission.patientName}
                  onChange={(e) => setNewAdmission({...newAdmission, patientName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  placeholder="Ex: Ahmed Alaoui"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">ID CIN</label>
                <input 
                  required
                  type="text"
                  value={newAdmission.patientCIN}
                  onChange={(e) => setNewAdmission({...newAdmission, patientCIN: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  placeholder="Ex: AB123456"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Chambre</label>
                <input 
                  required
                  type="text"
                  value={newAdmission.room}
                  onChange={(e) => setNewAdmission({...newAdmission, room: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  placeholder="Ex: 101A"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Statut Initial</label>
                <select 
                  value={newAdmission.status}
                  onChange={(e) => setNewAdmission({...newAdmission, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="Stable">Stable</option>
                  <option value="Recovering">En convalescence</option>
                  <option value="Critical">Critique (URGENCE)</option>
                </select>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Mesures Initiales (Optionnel)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Pouls (BPM)</label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number"
                        value={newAdmission.pulse}
                        onChange={(e) => setNewAdmission({...newAdmission, pulse: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                        placeholder="Ex: 75"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Température (°C)</label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number"
                        step="0.1"
                        value={newAdmission.temperature}
                        onChange={(e) => setNewAdmission({...newAdmission, temperature: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                        placeholder="Ex: 37.2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tension (mmHg)</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        value={newAdmission.bloodPressure}
                        onChange={(e) => setNewAdmission({...newAdmission, bloodPressure: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                        placeholder="Ex: 120/80"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Saturation (%)</label>
                    <div className="relative">
                      <Wind className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="number"
                        value={newAdmission.oxygenSaturation}
                        onChange={(e) => setNewAdmission({...newAdmission, oxygenSaturation: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-hospital-blue-500 transition-all"
                        placeholder="Ex: 98"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-hospital-blue-600 text-white rounded-2xl font-bold hover:bg-hospital-blue-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-hospital-blue-100"
              >
                <Plus size={20} />
                Admettre le Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
