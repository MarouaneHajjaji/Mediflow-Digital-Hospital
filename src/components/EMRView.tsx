import React from 'react';
import { 
  FileText, 
  History, 
  Plus, 
  Download, 
  Share2, 
  Lock,
  Search,
  ChevronRight,
  X,
  Trash2,
  AlertTriangle,
  Check,
  Archive,
  Edit2
} from 'lucide-react';
import { Patient } from '../types';
import { cn } from '../lib/utils';

interface EMRViewProps {
  patients: Patient[];
  initialSearchTerm?: string;
  onArchiveRecord?: (record: any) => void;
  records: any[];
  setRecords: React.Dispatch<React.SetStateAction<any[]>>;
}

export const EMRView: React.FC<EMRViewProps> = ({ 
  patients, 
  initialSearchTerm = '', 
  onArchiveRecord,
  records,
  setRecords
}) => {
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingRecordId, setEditingRecordId] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [showShareToast, setShowShareToast] = React.useState(false);
  const [recordToDelete, setRecordToDelete] = React.useState<any>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [newRecord, setNewRecord] = React.useState({
    patientId: '',
    type: 'Consultation Générale',
    doctor: 'Dr. Karim Tazi',
    summary: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchive = record.isArchived === showArchived;
    return matchesSearch && matchesArchive;
  });

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingRecordId) {
      setRecords(prev => prev.map(r => {
        if (r.id === editingRecordId) {
          const patient = patients.find(p => p.id === newRecord.patientId);
          return {
            ...r,
            patient: patient ? patient.name : r.patient,
            date: newRecord.date,
            type: newRecord.type,
            doctor: newRecord.doctor,
            summary: newRecord.summary
          };
        }
        return r;
      }));
      setIsEditing(false);
      setEditingRecordId(null);
    } else {
      const patient = patients.find(p => p.id === newRecord.patientId);
      if (!patient) return;

      const record = {
        id: (records.length + 1).toString(),
        patient: patient.name,
        date: newRecord.date,
        type: newRecord.type,
        doctor: newRecord.doctor,
        summary: newRecord.summary,
        isArchived: false
      };

      setRecords([record, ...records]);
    }

    setIsModalOpen(false);
    setNewRecord({
      patientId: '',
      type: 'Consultation Générale',
      doctor: 'Dr. Karim Tazi',
      summary: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditRecord = (record: any) => {
    const patient = patients.find(p => p.name === record.patient);
    setNewRecord({
      patientId: patient ? patient.id : '',
      type: record.type,
      doctor: record.doctor,
      summary: record.summary,
      date: record.date
    });
    setIsEditing(true);
    setEditingRecordId(record.id);
    setIsModalOpen(true);
  };

  const handleArchiveRecord = (id: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === id) {
        const newArchivedState = !r.isArchived;
        if (newArchivedState && onArchiveRecord) {
          onArchiveRecord(r);
        }
        return { ...r, isArchived: newArchivedState };
      }
      return r;
    }));
  };

  const handleDownloadPDF = async (record: any) => {
    setDownloadingId(record.id);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const content = `
DOSSIER MÉDICAL ÉLECTRONIQUE - EMR-${record.id.padStart(4, '0')}
--------------------------------------------------
PATIENT: ${record.patient}
DATE: ${record.date}
TYPE: ${record.type}
MÉDECIN: ${record.doctor}

RÉSUMÉ CLINIQUE:
${record.summary}

--------------------------------------------------
Document généré le ${new Date().toLocaleString()}
Ce document est confidentiel et protégé par le secret médical.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EMR_${record.patient.replace(/\s+/g, '_')}_${record.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setDownloadingId(null);
  };

  const handleShare = (record: any) => {
    // Simulate sharing
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setRecordToDelete(null);
    if (selectedRecord?.id === id) setSelectedRecord(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dossier Médical Électronique</h2>
          <p className="text-slate-500">Accès sécurisé aux antécédents et dossiers des patients.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <History size={18} />
            Historique
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={20} />
            Nouvelle Entrée
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recherche Rapide</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Nom du patient, type, médecin..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all text-slate-900"
              />
            </div>
            <div className="space-y-2">
              {patients.slice(0, 5).map((patient) => (
                <button 
                  key={patient.id} 
                  onClick={() => setSearchTerm(patient.name)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-all group border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-hospital-blue-100 flex items-center justify-center text-hospital-blue-600 text-xs font-bold border border-hospital-blue-200">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-hospital-blue-600">{patient.name}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-hospital-blue-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Filtres</h3>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                showArchived 
                  ? "bg-amber-50 border-amber-200 text-amber-700" 
                  : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Archive size={18} />
              <span className="text-sm font-medium">{showArchived ? 'Voir les dossiers actifs' : 'Voir les dossiers archivés'}</span>
            </button>
          </div>

          <div className="card p-6 bg-slate-800 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Lock size={20} className="text-blue-400" />
              </div>
              <h3 className="font-bold">Sécurité des Données</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              Tous les dossiers sont chiffrés de bout en bout. L'accès est tracé et réservé au personnel autorisé uniquement.
            </p>
            <button className="mt-4 text-xs font-bold text-blue-400 hover:underline relative z-10">Consulter le journal d'accès</button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {searchTerm ? `Résultats pour "${searchTerm}"` : 'Dernières Mises à Jour'}
            </h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredRecords.length} Dossiers</span>
          </div>
          
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div key={record.id} className="card p-6 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-hospital-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-hospital-blue-100 rounded-xl flex items-center justify-center text-hospital-blue-600 border border-hospital-blue-200">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{record.type}</h4>
                      <p className="text-xs text-slate-500">Patient: <span className="font-semibold text-slate-700">{record.patient}</span> • {record.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDownloadPDF(record)}
                      disabled={downloadingId === record.id}
                      className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all disabled:opacity-50"
                      title="Télécharger PDF"
                    >
                      {downloadingId === record.id ? (
                        <div className="w-[18px] h-[18px] border-2 border-hospital-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                    <button 
                      onClick={() => handleShare(record)}
                      className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                      title="Partager"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleEditRecord(record)}
                      className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleArchiveRecord(record.id)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        record.isArchived 
                          ? "text-amber-600 hover:bg-amber-50" 
                          : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                      )}
                      title={record.isArchived ? "Désarchiver" : "Archiver"}
                    >
                      <Archive size={18} />
                    </button>
                    <button 
                      onClick={() => setRecordToDelete(record)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 italic">"{record.summary}"</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Signé par: <span className="font-medium text-slate-600">{record.doctor}</span></p>
                  <button 
                    onClick={() => setSelectedRecord(record)}
                    className="text-sm font-bold text-hospital-blue-600 hover:underline"
                  >
                    Voir le dossier complet
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-20 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Aucun dossier médical trouvé.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-hospital-blue-600 font-bold hover:underline"
              >
                Effacer la recherche
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white shrink-0">
              <h3 className="text-xl font-bold">{isEditing ? 'Modifier l\'Entrée EMR' : 'Nouvelle Entrée EMR'}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                  setEditingRecordId(null);
                  setNewRecord({
                    patientId: '',
                    type: 'Consultation Générale',
                    doctor: 'Dr. Karim Tazi',
                    summary: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddRecord} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient</label>
                <select 
                  required
                  value={newRecord.patientId}
                  onChange={(e) => setNewRecord({...newRecord, patientId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Type d'entrée</label>
                  <select 
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  >
                    <option value="Consultation Générale">Consultation Générale</option>
                    <option value="Cardiologie">Cardiologie</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                    <option value="Chirurgie">Chirurgie</option>
                    <option value="Urgence">Urgence</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Résumé de la visite</label>
                <textarea 
                  required
                  value={newRecord.summary}
                  onChange={(e) => setNewRecord({...newRecord, summary: e.target.value})}
                  placeholder="Notes cliniques, observations, recommandations..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all"
                >
                  {isEditing ? 'Enregistrer les modifications' : 'Ajouter au dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-400" size={24} />
                <div>
                  <h3 className="text-xl font-bold">Détails du Dossier</h3>
                  <p className="text-xs text-slate-400">ID: EMR-{selectedRecord.id.padStart(4, '0')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="text-lg font-bold text-slate-900">{selectedRecord.patient}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date de l'examen</p>
                  <p className="text-lg font-bold text-slate-900">{selectedRecord.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type de consultation</p>
                  <p className="text-lg font-bold text-slate-900">{selectedRecord.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Médecin responsable</p>
                  <p className="text-lg font-bold text-slate-900">{selectedRecord.doctor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Département</p>
                  <p className="text-lg font-bold text-slate-900">{patients.find(p => p.name === selectedRecord.patient)?.department || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescription Actuelle</p>
                <div className="bg-hospital-blue-50 p-6 rounded-2xl border border-hospital-blue-100 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-hospital-blue-600 uppercase tracking-widest mb-1">Médicament</p>
                    <p className="text-sm font-bold text-slate-900">{patients.find(p => p.name === selectedRecord.patient)?.medication || 'Aucun'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-hospital-blue-600 uppercase tracking-widest mb-1">Dosage</p>
                    <p className="text-sm font-bold text-slate-900">{patients.find(p => p.name === selectedRecord.patient)?.dosage || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-hospital-blue-600 uppercase tracking-widest mb-1">Fréquence</p>
                    <p className="text-sm font-bold text-slate-900">{patients.find(p => p.name === selectedRecord.patient)?.freq || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observations Cliniques</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRecord.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadPDF(selectedRecord)}
                    disabled={downloadingId === selectedRecord.id}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    {downloadingId === selectedRecord.id ? (
                      <div className="w-[18px] h-[18px] border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    {downloadingId === selectedRecord.id ? 'Génération...' : 'Télécharger PDF'}
                  </button>
                  <button 
                    onClick={() => handleShare(selectedRecord)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    <Share2 size={18} />
                    Partager
                  </button>
                  <button 
                    onClick={() => setRecordToDelete(selectedRecord)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="px-6 py-2 bg-hospital-blue-600 text-white rounded-xl text-sm font-bold hover:bg-hospital-blue-700 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <History className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold">Historique des Dossiers</h3>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                {records.map((record, idx) => (
                  <div key={record.id} className="relative flex items-start gap-6">
                    <div className="absolute left-0 mt-1.5 w-10 h-10 rounded-full bg-white border-4 border-hospital-blue-100 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-hospital-blue-600"></div>
                    </div>
                    <div className="flex-1 ml-12">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-hospital-blue-600 uppercase tracking-widest">{record.date}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{record.type}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{record.patient}</h4>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1 italic">"{record.summary}"</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Médecin: {record.doctor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setRecordToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setRecordToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-lg font-bold">Confirmer la suppression</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le dossier de <strong>{recordToDelete.patient}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDeleteRecord(recordToDelete.id)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <p className="text-sm font-bold">Lien de partage copié dans le presse-papier !</p>
          </div>
        </div>
      )}
    </div>
  );
};
