import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Scan,
  Search,
  Smartphone,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { recognize } from 'tesseract.js';
import { api } from '../lib/api';
import { getBackendBaseUrl } from '../lib/apiBase';
import { cn } from '../lib/utils';
import { ArchiveServerInfo, Patient, ScannedDocument } from '../types';

interface MedicalRecordSummary {
  id: string;
  patient: string;
  date: string;
  type: string;
  doctor: string;
  summary: string;
  isArchived?: boolean;
}

interface ScanAnalysis {
  fullText?: string;
  rawText?: string;
  structuredData?: Record<string, unknown>[];
  patientInfo?: {
    name?: string;
    age?: string;
    date?: string;
    diagnosis?: string;
  };
  documentTitle?: string;
}

interface ArchiveViewProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  scannedDocuments: ScannedDocument[];
  setScannedDocuments: React.Dispatch<React.SetStateAction<ScannedDocument[]>>;
  medicalRecords: MedicalRecordSummary[];
}

const buildOcrDocumentTitle = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '').trim();
  return baseName ? `Scan ${baseName}` : `Document numerise ${new Date().toLocaleDateString()}`;
};

const mergeScannedDocuments = (
  existing: ScannedDocument[],
  incoming: ScannedDocument[],
): ScannedDocument[] => {
  const byId = new Map(existing.map((doc) => [doc.id, doc]));
  incoming.forEach((doc) => {
    const previous = byId.get(doc.id);
    byId.set(doc.id, previous ? { ...previous, ...doc } : doc);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const left = b.uploadedAt || b.date || '';
    const right = a.uploadedAt || a.date || '';
    return left.localeCompare(right);
  });
};

export const ArchiveView = ({
  patients,
  setPatients,
  scannedDocuments,
  setScannedDocuments,
  medicalRecords,
}: ArchiveViewProps) => {
  const [activeView, setActiveView] = useState<'patients' | 'documents'>('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [dayFilter, setDayFilter] = useState('All');
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPhoneScanModal, setShowPhoneScanModal] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedArchivedPatient, setSelectedArchivedPatient] = useState<Patient | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ScannedDocument | null>(null);
  const [archiveServerInfo, setArchiveServerInfo] = useState<ArchiveServerInfo | null>(null);
  const [copiedScanLink, setCopiedScanLink] = useState(false);
  const [scanQrSrc, setScanQrSrc] = useState<string | null>(null);
  const [isSyncingMobileDocs, setIsSyncingMobileDocs] = useState(false);
  const [deletingArchivedPatientId, setDeletingArchivedPatientId] = useState<string | null>(null);
  const [deletingScannedDocumentId, setDeletingScannedDocumentId] = useState<string | null>(null);

  const CopiedScanLink = copiedScanLink;
  const isPdfScanFile = Boolean(
    selectedFile && (
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf')
    )
  );

  const activePatients = useMemo(
    () => patients.filter((patient) => !patient.isArchived),
    [patients],
  );

  const matchesFilters = (value: string, dateValue?: string) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const source = value.toLowerCase();
    const date = dateValue || '';
    const [year = '', month = '', day = ''] = date.split('-');

    if (normalizedSearch && !source.includes(normalizedSearch) && !date.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    if (yearFilter !== 'All' && year !== yearFilter) {
      return false;
    }
    if (monthFilter !== 'All' && month !== monthFilter) {
      return false;
    }
    if (dayFilter !== 'All' && day !== dayFilter) {
      return false;
    }
    return true;
  };

  const archivedPatients = useMemo(
    () => patients.filter((patient) => Boolean(patient.isArchived)).filter((patient) => {
      const referenceDate = patient.exitDate || patient.entryDate || patient.lastVisit || '';
      return matchesFilters(`${patient.id} ${patient.name} ${referenceDate}`, referenceDate);
    }),
    [patients, searchTerm, yearFilter, monthFilter, dayFilter],
  );

  const filteredScannedDocuments = useMemo(
    () => scannedDocuments.filter((doc) => matchesFilters(`${doc.id} ${doc.name} ${doc.patientName || ''} ${doc.date}`, doc.date)),
    [scannedDocuments, searchTerm, yearFilter, monthFilter, dayFilter],
  );

  const syncMobileDocuments = async (silent = false) => {
    setIsSyncingMobileDocs(true);
    try {
      const documents = await api.getArchiveDocuments();
      setScannedDocuments((prev) => mergeScannedDocuments(prev, documents));
      if (!silent) {
        alert(`${documents.length} document(s) synchronise(s).`);
      }
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : 'Synchronisation impossible.';
        alert(`Erreur de synchronisation: ${message}`);
      }
    } finally {
      setIsSyncingMobileDocs(false);
    }
  };

  useEffect(() => {
    const loadServerInfo = async () => {
      try {
        const info = await api.getArchiveServerInfo();
        setArchiveServerInfo(info);
        if (info.scanUrl) {
          setScanQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(info.scanUrl)}`);
        }
      } catch (error) {
        console.error('Impossible de charger les informations du scan mobile:', error);
      }
    };

    void loadServerInfo();
    void syncMobileDocuments(true);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setScannedText(null);
    (window as any)._lastScannedData = null;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setFilePreview(result);
      if (!docName) {
        setDocName(buildOcrDocumentTitle(file.name));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedFile || !filePreview) {
      return;
    }

    setIsScanning(true);
    setScannedText(null);

    try {
      if (!isPdfScanFile) {
        const result = await recognize(selectedFile, 'fra+eng', {
          logger: () => undefined,
        });
        const extractedText = result.data.text?.trim() || '';

        if (!extractedText) {
          throw new Error("Aucun texte n'a pu etre extrait de l'image.");
        }

        const fallbackTitle = buildOcrDocumentTitle(selectedFile.name);
        setScannedText(extractedText);
        if (!docName) {
          setDocName(fallbackTitle);
        }

        (window as any)._lastScannedData = {
          fullText: extractedText,
          rawText: extractedText,
          structuredData: [],
          documentTitle: fallbackTitle,
        };
        return;
      }

      const data = await api.analyzeArchiveDocument({
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/pdf',
        dataUrl: filePreview,
      });

      const analyzedText = data.fullText || data.rawText || '';
      if (!analyzedText) {
        throw new Error("Aucune reponse recue de l'IA.");
      }

      setScannedText(analyzedText);
      if (data.documentTitle && !docName) {
        setDocName(data.documentTitle);
      }

      const detectedName = data.patientInfo?.name?.trim();
      if (!selectedPatientId && detectedName) {
        const normalizedName = detectedName.toLowerCase();
        const matchedPatient = patients.find((patient) =>
          patient.name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(patient.name.toLowerCase()),
        );
        if (matchedPatient) {
          setSelectedPatientId(matchedPatient.id);
        }
      }

      (window as any)._lastScannedData = data as ScanAnalysis;
    } catch (error) {
      console.error("Erreur detaillee lors de la numerisation:", error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Une erreur est survenue lors de la numerisation: ${errorMessage.substring(0, 100)}...`);
    } finally {
      setIsScanning(false);
    }
  };
  const handleDownloadTxt = () => {
    if (!scannedText) return;
    const blob = new Blob([scannedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan_archive_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    const data = (window as any)._lastScannedData;
    let csvContent = "";

    if (data && data.structuredData && Array.isArray(data.structuredData) && data.structuredData.length > 0) {
      // Use structured data if available
      const headers = Object.keys(data.structuredData[0]);
      csvContent = [
        headers.join(','),
        ...data.structuredData.map((row: any) => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');
    } else if (scannedText) {
      // Fallback to basic parsing
      csvContent = scannedText.split('\n').map(line => line.split(/\s{2,}|\|/).map(cell => `"${cell.trim()}"`).join(',')).join('\n');
    }

    if (!csvContent) return;

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan_archive_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyScanLink = async () => {
    if (!archiveServerInfo?.scanUrl) return;

    try {
      await navigator.clipboard.writeText(archiveServerInfo.scanUrl);
      setCopiedScanLink(true);
      window.setTimeout(() => setCopiedScanLink(false), 2000);
    } catch (error) {
      console.error('Impossible de copier le lien de scan:', error);
    }
  };

  const handleSaveToArchive = () => {
    if (!scannedText) return;
    const patient = patients.find(p => p.id === selectedPatientId);
    const newDoc = {
      id: `DOC-${Date.now()}`,
      name: docName || `Document numérisé ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      text: scannedText,
      patientId: patient?.id,
      patientName: patient?.name,
      source: 'desktop' as const,
      uploadedAt: new Date().toISOString(),
    };
    setScannedDocuments(prev => mergeScannedDocuments(prev, [newDoc]));
    
    // If a patient is selected, archive them
    if (selectedPatientId) {
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientId 
          ? { ...p, isArchived: true, exitDate: new Date().toISOString().split('T')[0] } 
          : p
      ));
    }

    setShowScanModal(false);
    setScannedText(null);
    setFilePreview(null);
    setSelectedFile(null);
    setDocName('');
    setSelectedPatientId('');
    setActiveView('documents');
    alert(selectedPatientId ? 'Document sauvegardé et dossier patient archivé avec succès !' : 'Document sauvegardé dans les archives avec succès !');
  };

  const handleDeleteArchivedPatient = async (patient: Patient) => {
    const confirmed = window.confirm(`Supprimer définitivement le dossier archivé de ${patient.name} ?`);
    if (!confirmed) {
      return;
    }

    setDeletingArchivedPatientId(patient.id);
    try {
      await api.deletePatient(patient.id);

      setPatients((prev) => prev.filter((item) => item.id !== patient.id));
      setScannedDocuments((prev) =>
        prev.filter((doc) => doc.patientId !== patient.id && doc.patientName !== patient.name),
      );

      if (selectedArchivedPatient?.id === patient.id) {
        setSelectedArchivedPatient(null);
      }

      alert('Dossier archivé supprimé avec succès.');
    } catch (error) {
      try {
        const restored = await api.updatePatient(patient.id, {
          ...patient,
          isArchived: false,
          exitDate: '',
        });

        setPatients((prev) =>
          prev.map((item) => (item.id === patient.id ? restored : item)),
        );

        if (selectedArchivedPatient?.id === patient.id) {
          setSelectedArchivedPatient(null);
        }

        alert('Suppression complète non disponible sur ce serveur. Le dossier a été retiré des archives.');
      } catch (fallbackError) {
        const message = fallbackError instanceof Error
          ? fallbackError.message
          : error instanceof Error
            ? error.message
            : 'Suppression impossible.';
        alert(`Erreur de suppression: ${message}`);
      }
    } finally {
      setDeletingArchivedPatientId(null);
    }
  };

  const handleDeleteScannedDocument = async (document: ScannedDocument) => {
    const confirmed = window.confirm(`Supprimer le document scanné "${document.name}" ?`);
    if (!confirmed) {
      return;
    }

    setDeletingScannedDocumentId(document.id);
    try {
      await api.deleteArchiveDocument(document.id);
      setScannedDocuments((prev) => prev.filter((item) => item.id !== document.id));

      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suppression impossible.';
      alert(`Erreur de suppression du document: ${message}`);
    } finally {
      setDeletingScannedDocumentId(null);
    }
  };

  const getDocumentImageUrl = (scannedDoc: ScannedDocument) => {
    if (!scannedDoc.imageUrl) return null;

    const rawUrl = scannedDoc.imageUrl.trim();
    if (!rawUrl) return null;

    // Keep absolute/data/blob URLs as-is (desktop scan preview, external links, etc.)
    if (
      rawUrl.startsWith('data:') ||
      rawUrl.startsWith('blob:') ||
      rawUrl.startsWith('http://') ||
      rawUrl.startsWith('https://')
    ) {
      return rawUrl;
    }

    const apiBase = getBackendBaseUrl();
    if (rawUrl.startsWith('/')) {
      return `${apiBase}${rawUrl}`;
    }

    return `${apiBase}/${rawUrl}`;
  };

  const handleOpenDocumentImage = (scannedDoc: ScannedDocument) => {
    const imageUrl = getDocumentImageUrl(scannedDoc);
    if (!imageUrl) {
      alert('Aucune image disponible pour ce document.');
      return;
    }

    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleExportDocumentImage = async (scannedDoc: ScannedDocument) => {
    if (!scannedDoc.imageUrl) {
      alert('Aucune image disponible pour ce document.');
      return;
    }

    try {
      const { blob, filename } = await api.downloadArchiveDocumentImage(scannedDoc.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de téléchargement.';
      alert(`Erreur export image: ${message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Archive</h2>
          <p className="text-slate-500">Stockage securise a long terme des documents et dossiers.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveView('patients')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeView === 'patients' ? "bg-white text-hospital-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Dossiers patients
            </button>
            <button 
              onClick={() => setActiveView('documents')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeView === 'documents' ? "bg-white text-hospital-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Documents Scannes
            </button>
          </div>
          <button 
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-hospital-blue-600 text-white rounded-xl text-sm font-bold hover:bg-hospital-blue-700 transition-all shadow-lg shadow-hospital-blue-100"
          >
            <Scan size={18} />
            Numériser document
          </button>
          <button 
            onClick={() => setShowPhoneScanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <Smartphone size={18} />
            Scan via téléphone
          </button>
          <button 
            onClick={() => void syncMobileDocuments(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={16} className={cn(isSyncingMobileDocs && 'animate-spin')} />
            Synchroniser
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold">
            <Lock size={16} />
            Stockage securise</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-2">
        <div className="rounded-2xl border border-hospital-blue-100 bg-gradient-to-r from-hospital-blue-600 via-hospital-blue-500 to-cyan-500 p-3 text-white shadow-lg shadow-hospital-blue-100">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">Capture Mobile</p>
              <h3 className="text-base font-bold">Scanne depuis ton téléphone, retrouve tout dans l'archive.</h3>
              <p className="max-w-2xl text-[11px] text-white/85">
                Ouvre la page mobile sur le téléphone connecté au même réseau, prends la photo, puis MediFlow synchronise le document dans cette vue.
              </p>
            </div>
            <button
              onClick={() => setShowPhoneScanModal(true)}
              className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur hover:bg-white/20 transition-all"
            >
              Ouvrir les instructions
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">QR scan mobile</p>
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center min-h-[145px]">
            {scanQrSrc ? (
              <img
                src={scanQrSrc}
                alt="QR code pour ouvrir le scan mobile"
                className="h-[124px] w-[124px] rounded-lg bg-white p-1.5"
              />
            ) : (
              <p className="text-xs text-slate-400">Generation du QR code...</p>
            )}
          </div>
          <p className="mt-3 text-xs font-bold text-slate-700 break-all">
            {archiveServerInfo?.scanUrl || 'Chargement du lien de scan...'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void handleCopyScanLink()}
              disabled={!archiveServerInfo?.scanUrl}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              <Copy size={14} />
              {CopiedScanLink ? 'Copié' : 'Copier'}
            </button>
            {archiveServerInfo?.scanUrl && (
              <a
                href={archiveServerInfo.scanUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink size={14} />
                Ouvrir
              </a>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Astuce: pour un vrai scan depuis le téléphone, utilise l'IP locale de ton PC, pas seulement sur <span className="font-mono">127.0.0.1</span>.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher dans les archives (ID, Nom, Date)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <select 
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Annee</option>
                {Array.from({length: 31}, (_, i) => (2000 + i).toString()).reverse().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Mois</option>
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select 
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Jour</option>
                {Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                setYearFilter('All');
                setMonthFilter('All');
                setDayFilter('All');
                setSearchTerm('');
              }}
              className="px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
            >
              Reinitialiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeView === 'patients' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ID Archive</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date d'entree / sortie</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archivedPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                          <FileText size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-500">#{patient.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          Entrée : {patient.entryDate || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          Sortie: {patient.exitDate || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">Archive</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedArchivedPatient(patient)}
                          className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" 
                          title="Voir dossier"
                        >
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" title="Telecharger">
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => void handleDeleteArchivedPatient(patient)}
                          disabled={deletingArchivedPatientId === patient.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                          title="Supprimer dossier archive"
                        >
                          {deletingArchivedPatientId === patient.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {archivedPatients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Aucun dossier archivé trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date de numérisation</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScannedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-hospital-blue-50 text-hospital-blue-600 rounded-lg">
                          <Scan size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                          {doc.patientName && (
                            <p className="text-[10px] text-hospital-blue-600 font-bold uppercase tracking-wider">Patient: {doc.patientName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-500">{doc.id}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {doc.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedDocument(doc)}
                          className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" 
                          title="Voir contenu"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const blob = new Blob([doc.text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${doc.name}.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" 
                          title="Télécharger TXT"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => void handleDeleteScannedDocument(doc)}
                          disabled={deletingScannedDocumentId === doc.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                          title="Supprimer document"
                        >
                          {deletingScannedDocumentId === doc.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {scannedDocuments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      Aucun document scanné. Utilisez le bouton "Numériser document" pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPhoneScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-hospital-blue-50 text-hospital-blue-600 rounded-xl">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Scan mobile MediFlow</h3>
                  <p className="text-sm text-slate-500">Utilise ton téléphone pour envoyer des documents vers cette archive.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneScanModal(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">URL de scan</p>
                <p className="mt-2 text-sm font-bold text-slate-900 break-all">
                  {archiveServerInfo?.scanUrl || 'Chargement du lien...'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleCopyScanLink()}
                    disabled={!archiveServerInfo?.scanUrl}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    <Copy size={14} />
                    {CopiedScanLink ? 'Lien copié' : 'Copier le lien'}
                  </button>
                  {archiveServerInfo?.scanUrl && (
                    <a
                      href={archiveServerInfo.scanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink size={14} />
                      Ouvrir la page mobile
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-hospital-blue-600 uppercase tracking-widest">1. Même Wi-Fi</p>
                  <p className="mt-2 text-sm text-slate-600">Connecte le téléphone et le PC sur le même réseau local.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-hospital-blue-600 uppercase tracking-widest">2. Ouvre le lien</p>
                  <p className="mt-2 text-sm text-slate-600">Depuis le téléphone, ouvre l'URL ci-dessus puis prends la photo.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-hospital-blue-600 uppercase tracking-widest">3. Synchronise</p>
                  <p className="mt-2 text-sm text-slate-600">Le document apparaît ici automatiquement ou via le bouton synchroniser.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedDocument.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedDocument.patientName ? `Patient: ${selectedDocument.patientName}` : 'Document non lié à un patient'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-6 overflow-y-auto max-h-[calc(90vh-96px)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 min-h-[200px] max-h-[240px] flex items-center justify-center overflow-hidden p-3">
                  {selectedDocument.imageUrl ? (
                    <img
                      src={getDocumentImageUrl(selectedDocument) ?? undefined}
                      alt={selectedDocument.name}
                      className="h-full w-auto max-h-[210px] max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-sm text-slate-400">Aperçu image indisponible</div>
                  )}
                </div>
                {selectedDocument.text && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Texte / notes</p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                      {selectedDocument.text}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">Métadonnées</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">ID</span>
                      <span className="font-mono text-slate-700">{selectedDocument.id}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Date</span>
                      <span className="text-slate-700">{selectedDocument.date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Source</span>
                      <span className="text-slate-700">{selectedDocument.source || 'archive'}</span>
                    </div>
                    {selectedDocument.type && (
                      <div>
                        <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Type</span>
                        <span className="text-slate-700">{selectedDocument.type}</span>
                      </div>
                    )}
                    {selectedDocument.description && (
                      <div>
                        <span className="block text-slate-400 text-xs uppercase font-bold tracking-wider">Description</span>
                        <span className="text-slate-700">{selectedDocument.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenDocumentImage(selectedDocument)}
                    disabled={!selectedDocument.imageUrl}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Eye size={18} />
                    Afficher l'image
                  </button>
                  <button
                    onClick={() => void handleExportDocumentImage(selectedDocument)}
                    disabled={!selectedDocument.imageUrl}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Download size={18} />
                    Télécharger l'image
                  </button>
                </div>

                <button
                  onClick={() => {
                    const blob = new Blob([selectedDocument.text || selectedDocument.description || ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${selectedDocument.name}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <FileText size={18} />
                  Exporter le contenu texte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-hospital-blue-50 text-hospital-blue-600 rounded-xl">
                  <Scan size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Numérisation de document papier</h3>
              </div>
              <button 
                onClick={() => {
                  setShowScanModal(false);
                  setScannedText(null);
                  setFilePreview(null);
                  setSelectedFile(null);
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {!scannedText ? (
                <div className="space-y-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer",
                      filePreview ? "border-hospital-blue-500 bg-hospital-blue-50" : "border-slate-200 hover:border-hospital-blue-400 hover:bg-slate-50"
                    )}
                    onClick={() => document.getElementById('scan-upload')?.click()}
                  >
                    <input 
                      id="scan-upload"
                      type="file" 
                      accept="image/*,application/pdf,.pdf"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {filePreview ? (
                      isPdfScanFile ? (
                        <div className="relative w-full max-w-xl rounded-lg overflow-hidden border border-hospital-blue-200 shadow-lg bg-white">
                          <iframe
                            src={filePreview}
                            title="Aperçu PDF"
                            className="w-full h-[360px]"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs font-bold px-3 py-2 backdrop-blur-sm">
                            Aperçu PDF • {selectedFile?.name}
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden border border-hospital-blue-200 shadow-lg">
                          <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Changer l'image</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="p-4 bg-white rounded-2xl text-slate-400 shadow-sm border border-slate-100">
                          <Plus size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-700">Importer le document à scanner</p>
                          <p className="text-sm text-slate-400">Photo papier ou fichier PDF (JPG, PNG, PDF)</p>
                        </div>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={handleScan}
                    disabled={!filePreview || isScanning}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg",
                      !filePreview || isScanning 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                        : "bg-hospital-blue-600 text-white hover:bg-hospital-blue-700 shadow-hospital-blue-100"
                    )}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Analyse OCR en cours...
                      </>
                    ) : (
                      <>
                        <Scan size={20} />
                        Lancer la numérisation intelligente
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Check size={18} />
                    </div>
                    <p className="text-sm font-bold">Numérisation réussie ! Les données ont été extraites avec succès.</p>
                  </div>

                  {(window as any)._lastScannedData?.patientInfo && (
                    <div className="bg-hospital-blue-50 border border-hospital-blue-100 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-hospital-blue-700 font-bold text-sm">
                        <User size={16} />
                        Informations patient extraites
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {(window as any)._lastScannedData.patientInfo.name && (
                          <div className="text-xs">
                            <span className="text-slate-400 block uppercase font-bold tracking-widest mb-0.5">Nom</span>
                            <span className="text-slate-700 font-medium">{(window as any)._lastScannedData.patientInfo.name}</span>
                          </div>
                        )}
                        {(window as any)._lastScannedData.patientInfo.age && (
                          <div className="text-xs">
                            <span className="text-slate-400 block uppercase font-bold tracking-widest mb-0.5">Âge</span>
                            <span className="text-slate-700 font-medium">{(window as any)._lastScannedData.patientInfo.age}</span>
                          </div>
                        )}
                        {(window as any)._lastScannedData.patientInfo.date && (
                          <div className="text-xs">
                            <span className="text-slate-400 block uppercase font-bold tracking-widest mb-0.5">Date</span>
                            <span className="text-slate-700 font-medium">{(window as any)._lastScannedData.patientInfo.date}</span>
                          </div>
                        )}
                        {(window as any)._lastScannedData.patientInfo.diagnosis && (
                          <div className="text-xs col-span-2">
                            <span className="text-slate-400 block uppercase font-bold tracking-widest mb-0.5">Observations</span>
                            <span className="text-slate-700 font-medium">{(window as any)._lastScannedData.patientInfo.diagnosis}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nom du document</label>
                    <input 
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Ex: Ordonnance cardiologie Ahmed Alaoui, Bilan oncologie Lina Chraibi..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Lier à un dossier patient (optionnel)</label>
                    <select 
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    >
                      <option value="">Sélectionner un patient à archiver...</option>
                      {activePatients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                      ))}
                    </select>
                    {selectedPatientId && (
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider ml-1">
                        * Le dossier de ce patient sera automatiquement archivé après la sauvegarde.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Aperçu des données extraites</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                      {scannedText}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleDownloadTxt}
                      className="flex items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <FileText size={20} className="text-hospital-blue-500" />
                      Télécharger en .TXT
                    </button>
                    <button 
                      onClick={handleDownloadExcel}
                      className="flex items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <FileSpreadsheet size={20} className="text-emerald-500" />
                      Télécharger en .EXCEL (CSV)
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveToArchive}
                    className="w-full py-4 bg-hospital-blue-600 text-white rounded-2xl font-bold hover:bg-hospital-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-hospital-blue-100"
                  >
                    <Archive size={20} />
                    {selectedPatientId ? 'Archiver le dossier patient' : 'Sauvegarder dans l\'archive'}
                  </button>

                  <button 
                    onClick={() => {
                      setScannedText(null);
                      setFilePreview(null);
                      setSelectedFile(null);
                    }}
                    className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Numériser un autre document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Archived Patient Detail Modal */}
      {selectedArchivedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedArchivedPatient.name}</h3>
                  <p className="text-xs text-slate-400">Dossier archivé #{selectedArchivedPatient.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedArchivedPatient(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Âge / Genre</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.age} ans, {selectedArchivedPatient.gender}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Groupe sanguin</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.bloodType}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernière visite</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.lastVisit}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date d'entrée</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.entryDate || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date de sortie</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.exitDate || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Département</p>
                  <p className="text-sm font-bold text-slate-900">{selectedArchivedPatient.department || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-hospital-blue-600" />
                  Historique des dossiers médicaux (EMR)
                </h4>
                <div className="space-y-3">
                  {medicalRecords.filter(r => r.patient === selectedArchivedPatient.name).length > 0 ? (
                    medicalRecords
                      .filter(r => r.patient === selectedArchivedPatient.name)
                      .map((record) => (
                        <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-hospital-blue-200 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold text-hospital-blue-600 uppercase tracking-wider">{record.type}</p>
                              <p className="text-[10px] text-slate-400">{record.date} • Dr. {record.doctor}</p>
                            </div>
                            {record.isArchived && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold uppercase">Archive</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 italic">"{record.summary}"</p>
                        </div>
                      ))
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">Aucun historique EMR trouvé pour ce patient.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => void handleDeleteArchivedPatient(selectedArchivedPatient)}
                disabled={deletingArchivedPatientId === selectedArchivedPatient.id}
                className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {deletingArchivedPatientId === selectedArchivedPatient.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Supprimer le dossier
              </button>
              <button 
                onClick={() => setSelectedArchivedPatient(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Fermer le dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ArchiveView;
