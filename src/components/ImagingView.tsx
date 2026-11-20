import React, { useEffect, useState } from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  User,
  Plus,
  X,
  Save,
  Trash2,
  Archive,
  FileText,
  Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { Patient } from '../types';

interface ImagingStudy {
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
}

interface ImagingViewProps {
  patients: Patient[];
}

export const ImagingView: React.FC<ImagingViewProps> = ({ patients }) => {
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
  const [studyToDelete, setStudyToDelete] = useState<ImagingStudy | null>(null);
  const [studyToArchive, setStudyToArchive] = useState<ImagingStudy | null>(null);
  const [newStudy, setNewStudy] = useState({
    patientId: '',
    type: '',
    doctor: 'Dr. Yasmine Alaoui'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoadingStudies, setIsLoadingStudies] = useState(true);
  const [isSavingStudy, setIsSavingStudy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    api.getImagingStudies()
      .then((items) => {
        if (isMounted) {
          setStudies(items);
          setErrorMessage(null);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les examens d'imagerie.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStudies(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudies = studies.filter(study => {
    const belongsToVisiblePatient = patients.some(patient => patient.id === study.patientId);
    if (!belongsToVisiblePatient) return false;

    const matchesSearch = study.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || study.status === statusFilter;
    const matchesDate = !dateFilter || study.date === dateFilter;
    const matchesArchive = showArchived ? study.isArchived : !study.isArchived;
    
    return matchesSearch && matchesStatus && matchesDate && matchesArchive;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Patient", "Type d'examen", "Date", "Médecin", "Statut"];
    const csvContent = [
      headers.join(","),
      ...studies.map(s => [
        s.id,
        s.patient,
        s.type,
        s.date,
        s.doctor,
        s.status === 'Available' ? 'Disponible' : 'En cours'
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `examens_imagerie_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudy) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImageUrl = reader.result as string;
        const previousStudy = selectedStudy;
        const nextStudy = { ...selectedStudy, imageUrl: newImageUrl };

        setStudies(prev => prev.map(s => s.id === selectedStudy.id ? nextStudy : s));
        setSelectedStudy(nextStudy);
        setErrorMessage(null);

        try {
          const savedStudy = await api.updateImagingStudy(selectedStudy.id, {
            patientId: nextStudy.patientId,
            type: nextStudy.type,
            date: nextStudy.date,
            doctor: nextStudy.doctor,
            status: nextStudy.status,
            progress: nextStudy.progress,
            imageUrl: nextStudy.imageUrl,
            report: nextStudy.report,
            isArchived: nextStudy.isArchived,
          });
          setStudies(prev => prev.map(s => s.id === savedStudy.id ? savedStudy : s));
          setSelectedStudy(savedStudy);
        } catch (error) {
          setStudies(prev => prev.map(s => s.id === previousStudy.id ? previousStudy : s));
          setSelectedStudy(previousStudy);
          setErrorMessage(error instanceof Error ? error.message : "Impossible d'enregistrer l'image.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newStudy.patientId);
    if (!patient) return;

    setIsSavingStudy(true);
    setErrorMessage(null);

    if (isEditing && editingStudyId) {
      const currentStudy = studies.find(s => s.id === editingStudyId);
      if (!currentStudy) {
        setIsSavingStudy(false);
        return;
      }

      try {
        const savedStudy = await api.updateImagingStudy(editingStudyId, {
          patientId: patient.id,
          type: newStudy.type,
          date: currentStudy.date,
          doctor: newStudy.doctor,
          status: currentStudy.status,
          progress: currentStudy.progress,
          imageUrl: filePreview || currentStudy.imageUrl,
          report: currentStudy.report,
          isArchived: currentStudy.isArchived,
        });
        setStudies(prev => prev.map(s => s.id === editingStudyId ? savedStudy : s));
        setIsEditing(false);
        setEditingStudyId(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de modifier l'examen.");
        setIsSavingStudy(false);
        return;
      }
    } else {
      try {
        const savedStudy = await api.createImagingStudy({
          patientId: patient.id,
          type: newStudy.type,
          date: new Date().toISOString().split('T')[0],
          doctor: newStudy.doctor,
          status: 'Available',
          progress: 100,
          imageUrl: filePreview || undefined,
          report: 'Examen complet. Résultats en attente de validation radiologique.',
          isArchived: false,
        });
        setStudies(prev => [savedStudy, ...prev]);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible d'enregistrer l'examen.");
        setIsSavingStudy(false);
        return;
      }
    }

    setIsSavingStudy(false);
    setShowAddModal(false);
    setNewStudy({ patientId: '', type: '', doctor: 'Dr. Yasmine Alaoui' });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleEditStudy = (study: ImagingStudy) => {
    setNewStudy({
      patientId: study.patientId,
      type: study.type,
      doctor: study.doctor
    });
    setFilePreview(study.imageUrl || null);
    setIsEditing(true);
    setEditingStudyId(study.id);
    setShowAddModal(true);
  };

  const handleDeleteStudy = async (id: string) => {
    const previousStudies = studies;
    setStudies(prev => prev.filter(s => s.id !== id));
    setStudyToDelete(null);
    setErrorMessage(null);

    try {
      await api.deleteImagingStudy(id);
    } catch (error) {
      setStudies(previousStudies);
      setErrorMessage(error instanceof Error ? error.message : "Impossible de supprimer l'examen.");
    }
  };

  const handleArchiveStudy = async (id: string) => {
    const previousStudies = studies;
    setStudies(prev => prev.map(s => 
      s.id === id ? { ...s, isArchived: !s.isArchived } : s
    ));
    setStudyToArchive(null);
    setErrorMessage(null);

    try {
      const savedStudy = await api.archiveImagingStudy(id);
      setStudies(prev => prev.map(s => s.id === id ? savedStudy : s));
    } catch (error) {
      setStudies(previousStudies);
      setErrorMessage(error instanceof Error ? error.message : "Impossible d'archiver l'examen.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Imagerie médicale</h2>
          <p className="text-slate-500">Consultez les radiographies, IRM et scanners numérisés.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={20} />
          Nouvel examen
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par patient, type d'examen ou ID..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-transparent focus-within:border-hospital-blue-500 transition-all">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            >
              <option value="All">Tous les statuts</option>
              <option value="Available">Disponible</option>
              <option value="Processing">En cours</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-transparent focus-within:border-hospital-blue-500 transition-all">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              showArchived 
                ? "bg-amber-100 text-amber-700 border border-amber-200" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Archive size={16} />
            {showArchived ? 'Voir les actifs' : 'Archives'}
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Download size={16} />
            Exporter
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Examen</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Médecin</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudies.map((study) => (
                <tr key={study.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                        {study.imageUrl ? (
                          <img src={study.imageUrl} alt={study.type} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon size={22} className="text-white/30" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{study.type}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{study.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <User size={15} className="text-slate-400" />
                      {study.patient}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{study.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{study.doctor}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider",
                      study.status === 'Available' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {study.status === 'Available' ? 'Disponible' : `En cours ${study.progress || 0}%`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudy(study)}
                        disabled={study.status === 'Processing'}
                        className="p-2 bg-hospital-blue-50 text-hospital-blue-600 hover:bg-hospital-blue-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Visualiser"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditStudy(study)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-xl transition-all"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setStudyToArchive(study)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title={study.isArchived ? "Désarchiver" : "Archiver"}
                      >
                        <Archive size={16} />
                      </button>
                      <button
                        onClick={() => setStudyToDelete(study)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoadingStudies && (
          <div className="py-20 text-center bg-slate-50/50 border-t border-dashed border-slate-200">
            <ImageIcon size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
            <p className="text-slate-500 font-medium italic">Chargement des examens...</p>
          </div>
        )}
        {!isLoadingStudies && filteredStudies.length === 0 && (
          <div className="py-20 text-center bg-slate-50/50 border-t border-dashed border-slate-200">
            <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium italic">Aucun examen trouvé</p>
            {(searchTerm || statusFilter !== 'All' || dateFilter) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setDateFilter('');
                }}
                className="mt-4 text-hospital-blue-600 font-bold hover:underline text-sm"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Archive Confirmation Modal */}
      {studyToArchive && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setStudyToArchive(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Archive size={24} />
              </div>
              <h4 className="text-lg font-bold">{studyToArchive.isArchived ? 'Désarchiver' : 'Archiver'} l'examen</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Voulez-vous {studyToArchive.isArchived ? 'désarchiver' : 'archiver'} l'examen de <strong>{studyToArchive.patient}</strong> ? 
              {studyToArchive.isArchived ? ' Il sera de nouveau visible dans la liste principale.' : ' Il sera déplacé dans la section des archives.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setStudyToArchive(null)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleArchiveStudy(studyToArchive.id)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-lg shadow-amber-100"
              >
                {studyToArchive.isArchived ? 'Désarchiver' : 'Archiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studyToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setStudyToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <h4 className="text-lg font-bold">Confirmer la suppression</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'examen de <strong>{studyToDelete.patient}</strong> ({studyToDelete.type}) ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setStudyToDelete(null)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDeleteStudy(studyToDelete.id)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Study Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedStudy.type}</h3>
                <p className="text-sm text-slate-500">{selectedStudy.patient} • {selectedStudy.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-hospital-blue-600">
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => setSelectedStudy(null)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-4 border-slate-100 relative group/img">
                    {selectedStudy.imageUrl ? (
                      <img 
                        src={selectedStudy.imageUrl} 
                        alt={selectedStudy.type}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <ImageIcon size={64} className="opacity-20" />
                        <p className="text-sm font-medium">Aucune image disponible</p>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => document.getElementById('edit-image-upload')?.click()}
                        className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <Plus size={18} />
                        {selectedStudy.imageUrl ? 'Modifier l\'image' : 'Ajouter une image'}
                      </button>
                      <input 
                        id="edit-image-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditImage}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">Zoom +</button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">Zoom -</button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">Inverser</button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">Réinitialiser</button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="card p-6 bg-slate-50 border-none">
                    <div className="flex items-center gap-2 mb-4 text-hospital-blue-600">
                      <FileText size={18} />
                      <h4 className="font-bold uppercase tracking-wider text-xs">Compte-rendu médical</h4>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      "{selectedStudy.report || 'En attente de rédaction...'}"
                    </p>
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Signé par</p>
                      <p className="text-sm font-bold text-slate-900">{selectedStudy.doctor}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Détails de l'examen</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                        <span className="text-slate-500">ID examen</span>
                        <span className="font-bold text-slate-900">{selectedStudy.id}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                        <span className="text-slate-500">Modalité</span>
                        <span className="font-bold text-slate-900">{selectedStudy.type.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                        <span className="text-slate-500">Statut</span>
                        <span className="font-bold text-emerald-600">Validé</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Study Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm animate-in fade-in duration-300 md:pl-72">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Modifier l\'examen' : 'Nouvel examen'}</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditing(false);
                  setEditingStudyId(null);
                  setNewStudy({ patientId: '', type: '', doctor: 'Dr. Yasmine Alaoui' });
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudy} className="space-y-4 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold tracking-wide text-slate-500">Patient</label>
                <select 
                  required
                  value={newStudy.patientId}
                  onChange={(e) => setNewStudy({...newStudy, patientId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold tracking-wide text-slate-500">Type d'examen</label>
                <select 
                  required
                  value={newStudy.type}
                  onChange={(e) => setNewStudy({...newStudy, type: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="">Choisir un type</option>
                  <option value="Radiographie Thorax">Radiographie Thorax</option>
                  <option value="IRM Cérébrale">IRM Cérébrale</option>
                  <option value="Scanner Abdominal">Scanner Abdominal</option>
                  <option value="Échographie Pelvienne">Échographie Pelvienne</option>
                  <option value="Mammographie">Mammographie</option>
                  <option value="Scanner Thoracique">Scanner Thoracique</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold tracking-wide text-slate-500">Médecin prescripteur</label>
                <input 
                  type="text"
                  value={newStudy.doctor}
                  onChange={(e) => setNewStudy({...newStudy, doctor: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-bold tracking-wide text-slate-500">Fichier d’imagerie</label>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                    filePreview ? "border-hospital-blue-500 bg-hospital-blue-50" : "border-slate-200 hover:border-hospital-blue-400 hover:bg-slate-50"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {filePreview ? (
                    <div className="relative w-full max-h-56 overflow-hidden rounded-lg border border-hospital-blue-200 bg-slate-950">
                      <img src={filePreview} alt="Aperçu imagerie" className="h-full max-h-56 w-full object-contain" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm rounded-lg text-red-500 hover:bg-white transition-all shadow-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-xl text-slate-400 shadow-sm">
                        <ImageIcon size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">Cliquez pour télécharger</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG ou DICOM (Max. 10MB)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSavingStudy}
                className="w-full py-3 bg-hospital-blue-600 text-white rounded-2xl font-bold hover:bg-hospital-blue-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-hospital-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {isSavingStudy ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Lancer l\'examen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


