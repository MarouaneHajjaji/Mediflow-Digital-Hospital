import React, { useState } from 'react';
import {
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Download,
  FileText,
  X,
  Plus,
  User,
  Edit2,
  Trash2,
  Eye,
  Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient } from '../types';

interface LabViewProps {
  patients: Patient[];
}

interface LabMetric {
  label: string;
  value: string;
  unit?: string;
  reference?: string;
  interpretation?: 'normal' | 'high' | 'low' | 'alert';
}

interface LabAnalysis {
  id: string;
  patient: string;
  test: string;
  date: string;
  status: 'Pending' | 'Completed';
  result: string;
  sampleType: string;
  priority: 'Routine' | 'Urgent' | 'Stat';
  orderedBy: string;
  department: string;
  methodology?: string;
  analyzer?: string;
  biologist?: string;
  specimenCondition?: string;
  collectedAt: string;
  reportedAt?: string;
  turnaround: string;
  notes: string;
  metrics: LabMetric[];
}

interface LabResultEntry {
  id: string;
  patient: string;
  test: string;
  date: string;
  status: 'Pending' | 'Completed';
  result: string;
  notes?: string;
}

function getAnalysisDetails(analysis: {
  test: string;
  result: string;
  patient: string;
  status: string;
}) {
  const catalog: Record<string, Omit<LabAnalysis, 'id' | 'patient' | 'date' | 'status' | 'result' | 'test'>> = {
    'Bilan Sanguin Complet': {
      sampleType: 'Sang veineux',
      priority: 'Routine',
      orderedBy: 'Dr. Hassan El Idrissi',
      department: 'Médecine interne',
      collectedAt: '08:10',
      reportedAt: '12:45',
      turnaround: '4h35',
      notes: 'Paramètres hématologiques stables. Contrôle standard au prochain suivi.',
      metrics: [
        { label: 'Hémoglobine', value: '13.9', unit: 'g/dL', reference: '13.0 - 17.0', interpretation: 'normal' },
        { label: 'Leucocytes', value: '7.4', unit: 'G/L', reference: '4.0 - 10.0', interpretation: 'normal' },
        { label: 'Plaquettes', value: '268', unit: 'G/L', reference: '150 - 400', interpretation: 'normal' },
      ],
    },
    'Analyse d\'Urine': {
      sampleType: 'Urine du matin',
      priority: 'Urgent',
      orderedBy: 'Dr. Leila El Amrani',
      department: 'Néphrologie',
      collectedAt: '09:20',
      reportedAt: undefined,
      turnaround: 'En attente',
      notes: 'Recherche de protéinurie et de signe infectieux. Validation après lecture automate.',
      metrics: [
        { label: 'Nitrites', value: 'En cours', interpretation: 'alert' },
        { label: 'Leucocytes', value: 'En cours', interpretation: 'alert' },
      ],
    },
    'Test COVID-19 PCR': {
      sampleType: 'Écouvillon nasopharyngé',
      priority: 'Stat',
      orderedBy: 'Dr. Mehdi Chafik',
      department: 'Infectiologie',
      collectedAt: '07:55',
      reportedAt: '10:05',
      turnaround: '2h10',
      notes: 'Aucun ARN viral détecté. Corréler au tableau clinique si symptômes persistants.',
      metrics: [
        { label: 'SARS-CoV-2', value: 'Non détecté', interpretation: 'normal' },
        { label: 'Contrôle interne', value: 'Valide', interpretation: 'normal' },
      ],
    },
    'Glycémie à jeun': {
      sampleType: 'Sérum',
      priority: 'Routine',
      orderedBy: 'Dr. Karim Tazi',
      department: 'Endocrinologie',
      collectedAt: '07:40',
      reportedAt: '09:00',
      turnaround: '1h20',
      notes: 'Hyperglycémie à confirmer sur contrôle. Surveillance alimentaire recommandée.',
      metrics: [
        { label: 'Glycémie', value: '1.42', unit: 'g/L', reference: '0.70 - 1.10', interpretation: 'high' },
        { label: 'HbA1c estimée', value: '6.8', unit: '%', reference: '< 6.5', interpretation: 'high' },
      ],
    },
  };

  const defaultDetails = {
    sampleType: 'Prélèvement standard',
    priority: analysis.status === 'Pending' ? 'Urgent' : 'Routine',
    orderedBy: 'Dr. Service',
    department: 'Laboratoire central',
    collectedAt: '08:30',
    reportedAt: analysis.status === 'Completed' ? '11:00' : undefined,
    turnaround: analysis.status === 'Completed' ? '2h30' : 'En attente',
    notes: `Analyse ${analysis.test} pour ${analysis.patient}. Résultat actuel: ${analysis.result}.`,
    metrics: [],
  };

  const metadataByTest: Record<string, Pick<LabAnalysis, 'methodology' | 'analyzer' | 'biologist' | 'specimenCondition'>> = {
    'Bilan Sanguin Complet': {
      methodology: 'Cytometrie automatisee',
      analyzer: 'Sysmex XN-1000',
      biologist: 'Dr. El Idrissi',
      specimenCondition: 'Conforme',
    },
    'Analyse d\'Urine': {
      methodology: 'Bandelette urinaire + lecture automate',
      analyzer: 'Clinitek Status+',
      biologist: 'Dr. Benali',
      specimenCondition: 'En validation',
    },
    'Test COVID-19 PCR': {
      methodology: 'RT-PCR multiplex',
      analyzer: 'GeneXpert IV',
      biologist: 'Dr. Mansouri',
      specimenCondition: 'Conforme',
    },
    'GlycÃ©mie Ã  jeun': {
      methodology: 'Dosage enzymatique hexokinase',
      analyzer: 'Cobas c311',
      biologist: 'Dr. Ait Said',
      specimenCondition: 'Serum non hemolyse',
    },
  };

  const metadata = metadataByTest[analysis.test] ?? {
    methodology: 'Analyse standard',
    analyzer: 'Plateforme laboratoire',
    biologist: 'Biologiste de garde',
    specimenCondition: analysis.status === 'Completed' ? 'Conforme' : 'En attente de validation',
  };

  return {
    ...(catalog[analysis.test] ?? defaultDetails),
    ...metadata,
  };
}

function getPatientDetails(patients: Patient[], patientName: string) {
  return patients.find((patient) => patient.name === patientName) ?? null;
}

export const LabView: React.FC<LabViewProps> = ({ patients }) => {
  const [results, setResults] = useState<LabResultEntry[]>([
    { id: '1', patient: 'Ahmed Alaoui', test: 'Bilan Sanguin Complet', date: '2026-05-12', status: 'Completed', result: 'Normal' },
    { id: '2', patient: 'Fatima Zahra Idrissi', test: 'Analyse d\'Urine', date: '2026-05-08', status: 'Pending', result: '-' },
    { id: '3', patient: 'Ayoub Ait Lahcen', test: 'Test COVID-19 PCR', date: '2026-05-14', status: 'Completed', result: 'Négatif' },
    { id: '4', patient: 'Youssef Benali', test: 'Glycémie à jeun', date: '2026-05-10', status: 'Completed', result: 'Élevé' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<any>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<any>(null);
  const [analysisToDelete, setAnalysisToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [newAnalysis, setNewAnalysis] = useState<{
    patientId: string;
    test: string;
    date: string;
    status: LabResultEntry['status'];
    notes: string;
  }>({
    patientId: '',
    test: 'Bilan Sanguin Complet',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    notes: '',
  });

  const handleAddAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newAnalysis.patientId);
    if (!patient) return;

    const newResult = {
      id: (results.length + 1).toString(),
      patient: patient.name,
      test: newAnalysis.test,
      date: newAnalysis.date,
      status: newAnalysis.status,
      result: '-',
      notes: newAnalysis.notes.trim(),
    };

    setResults([newResult, ...results]);
    setIsModalOpen(false);
    setNewAnalysis({
      patientId: '',
      test: 'Bilan Sanguin Complet',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: '',
    });
  };

  const handleUpdateAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnalysis) return;

    setResults(results.map(res => 
      res.id === editingAnalysis.id ? editingAnalysis : res
    ));
    setEditingAnalysis(null);
  };

  const handleDeleteAnalysis = (id: string) => {
    setResults(prev => prev.filter(res => res.id !== id));
    setAnalysisToDelete(null);
  };

  const handleDownloadReport = (res: LabResultEntry) => {
    const details = getAnalysisDetails(res);
    const patientDetails = getPatientDetails(patients, res.patient);
    const content = `
RAPPORT DE LABORATOIRE - LAB-${res.id.padStart(4, '0')}
--------------------------------------------------
PATIENT: ${res.patient}
CODE PATIENT: ${patientDetails?.patientCode || patientDetails?.id || '-'}
CHAMBRE: ${patientDetails?.room || '-'}
DEPARTEMENT PATIENT: ${patientDetails?.department || '-'}
DATE: ${res.date}
ANALYSE: ${res.test}
PRESCRIPTEUR: ${details.orderedBy}
SERVICE: ${details.department}
ECHANTILLON: ${details.sampleType}
ETAT ECHANTILLON: ${details.specimenCondition}
METHODOLOGIE: ${details.methodology}
AUTOMATE: ${details.analyzer}
BIOLOGISTE: ${details.biologist}
PRIORITE: ${details.priority}
PRELEVEMENT: ${details.collectedAt}
VALIDATION: ${details.reportedAt || '-'}
DELAI: ${details.turnaround}
STATUT: ${res.status === 'Completed' ? 'Terminé' : 'En cours'}
RÉSULTAT: ${res.result}
COMMENTAIRES: ${res.notes || details.notes}
 
--------------------------------------------------
Document généré le ${new Date().toLocaleString()}
MediFlow Digital Hospital - Service Laboratoire
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_Labo_${res.patient.replace(/\s+/g, '_')}_${res.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter(res => {
    const belongsToVisiblePatient = patients.some(patient => patient.name === res.patient);
    if (!belongsToVisiblePatient) return false;

    const matchesSearch = res.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         res.test.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || res.status === statusFilter;
    const matchesDate = !dateFilter || res.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Patient", "Type d'analyse", "Date", "Statut", "Résultat"];
    const csvContent = [
      headers.join(","),
      ...results.map(res => [
        `LAB-${res.id.padStart(4, '0')}`,
        res.patient,
        res.test,
        res.date,
        res.status === 'Completed' ? 'Terminé' : 'En cours',
        res.result
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `resultats_labo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Laboratoire</h2>
          <p className="text-slate-500">Suivi des analyses et résultats biologiques.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <FlaskConical size={20} />
          Nouvelle Analyse
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-2xl text-white">
            <FlaskConical size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Analyses</p>
            <h3 className="text-2xl font-bold text-slate-900">{results.length}</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-2xl text-white">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">En attente</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {results.filter(r => r.status === 'Pending').length}
            </h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl text-white">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Terminés</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {results.filter(r => r.status === 'Completed').length}
            </h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-2xl text-white">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Anormaux</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {results.filter(r => r.result === 'Élevé' || r.result === 'Positif').length}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Vue opérationnelle</h3>
              <p className="text-sm text-slate-500">Priorités, échantillons et délais de validation du laboratoire.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase">
              {results.filter((res) => getAnalysisDetails(res).priority !== 'Routine').length} prioritaires
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.slice(0, 3).map((res) => {
              const details = getAnalysisDetails(res);
              return (
                <div key={res.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{details.sampleType}</p>
                      <h4 className="text-sm font-bold text-slate-900">{res.test}</h4>
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border',
                      details.priority === 'Stat' ? 'bg-red-50 text-red-600 border-red-100' :
                      details.priority === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    )}>
                      {details.priority}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Patient:</span> {res.patient}</p>
                    <p><span className="font-semibold text-slate-900">Prescripteur:</span> {details.orderedBy}</p>
                    <p><span className="font-semibold text-slate-900">Délai:</span> {details.turnaround}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Alertes biologiques</h3>
          <div className="space-y-3">
            {results
              .filter((res) => res.result === 'Élevé' || res.result === 'Positif' || getAnalysisDetails(res).priority === 'Stat')
              .slice(0, 4)
              .map((res) => {
                const details = getAnalysisDetails(res);
                return (
                  <div key={res.id} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900">{res.patient}</p>
                      <span className="text-[10px] font-bold uppercase text-red-600">{res.result}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{res.test}</p>
                    <p className="mt-2 text-xs text-slate-500">{details.notes}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all text-slate-900"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-transparent focus-within:border-hospital-blue-500 transition-all">
              <Filter size={14} className="text-slate-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
              >
                <option value="All">Tous les statuts</option>
                <option value="Pending">En cours</option>
                <option value="Completed">Terminé</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-transparent focus-within:border-hospital-blue-500 transition-all">
              <Clock size={14} className="text-slate-500" />
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-slate-500 hover:text-slate-900">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Exporter CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type d'analyse</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Résultat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length > 0 ? (
                filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{res.patient}</p>
                      <p className="text-[10px] text-slate-500 uppercase">ID: LAB-{res.id.padStart(4, '0')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{res.test}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{getAnalysisDetails(res).methodology}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{getAnalysisDetails(res).sampleType} • {getAnalysisDetails(res).department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{res.date}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Prélèvement {getAnalysisDetails(res).collectedAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        res.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                      )}>
                        {res.status === 'Completed' ? 'Terminé' : 'En cours'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2">{getAnalysisDetails(res).priority} • {getAnalysisDetails(res).turnaround}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={cn(
                        "text-sm font-bold",
                        res.result === 'Élevé' ? "text-red-600" : 
                        res.result === 'Négatif' ? "text-emerald-600" : "text-slate-600"
                      )}>
                        {res.result}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setViewingAnalysis(res)}
                          className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingAnalysis(res)}
                          className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownloadReport(res)}
                          className="p-2 text-slate-500 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all"
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => setAnalysisToDelete(res)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <FlaskConical size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">Aucune analyse ne correspond à vos critères.</p>
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        setDateFilter('');
                      }}
                      className="mt-4 text-hospital-blue-600 font-bold hover:underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* New Analysis Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex min-h-full items-start justify-center py-6">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white">
              <h3 className="text-xl font-bold">Nouvelle Analyse</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddAnalysis} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    required
                    value={newAnalysis.patientId}
                    onChange={(e) => setNewAnalysis({...newAnalysis, patientId: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Type d'analyse</label>
                <select 
                  value={newAnalysis.test}
                  onChange={(e) => setNewAnalysis({...newAnalysis, test: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="Bilan Sanguin Complet">Bilan Sanguin Complet</option>
                  <option value="Analyse d'Urine">Analyse d'Urine</option>
                  <option value="Test COVID-19 PCR">Test COVID-19 PCR</option>
                  <option value="Glycémie à jeun">Glycémie à jeun</option>
                  <option value="Cholestérol">Cholestérol</option>
                  <option value="Fonction Rénale">Fonction Rénale</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    value={newAnalysis.date}
                    onChange={(e) => setNewAnalysis({...newAnalysis, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Statut</label>
                  <select 
                    value={newAnalysis.status}
                    onChange={(e) => setNewAnalysis({...newAnalysis, status: e.target.value as LabResultEntry['status']})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  >
                    <option value="Pending">En cours</option>
                    <option value="Completed">Terminé</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Commentaires laboratoire</label>
                <textarea
                  value={newAnalysis.notes}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, notes: e.target.value })}
                  placeholder="Ajouter un commentaire optionnel pour le laboratoire"
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
                  className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Créer l'analyse
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Analysis Modal */}
      {editingAnalysis && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex min-h-full items-start justify-center py-6">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white">
              <h3 className="text-xl font-bold">Modifier l'Analyse</h3>
              <button 
                onClick={() => setEditingAnalysis(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateAnalysis} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient</label>
                <input 
                  disabled
                  type="text" 
                  value={editingAnalysis.patient}
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Type d'analyse</label>
                <input 
                  disabled
                  type="text" 
                  value={editingAnalysis.test}
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Statut</label>
                  <select 
                    value={editingAnalysis.status}
                    onChange={(e) => setEditingAnalysis({...editingAnalysis, status: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  >
                    <option value="Pending">En cours</option>
                    <option value="Completed">Terminé</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Résultat</label>
                  <input 
                    type="text" 
                    value={editingAnalysis.result}
                    onChange={(e) => setEditingAnalysis({...editingAnalysis, result: e.target.value})}
                    placeholder="Entrer le résultat"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Commentaires laboratoire</label>
                <textarea
                  value={editingAnalysis.notes ?? getAnalysisDetails(editingAnalysis).notes}
                  onChange={(e) => setEditingAnalysis({...editingAnalysis, notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingAnalysis(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Enregistrer
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* View Analysis Modal */}
      {viewingAnalysis && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex min-h-full items-start justify-center py-6">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-hospital-blue-600 text-white">
              <div className="flex items-center gap-3">
                <FlaskConical size={24} />
                <h3 className="text-xl font-bold">Détails de l'Analyse</h3>
              </div>
              <button 
                onClick={() => setViewingAnalysis(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-hospital-blue-100 rounded-xl flex items-center justify-center text-hospital-blue-600 font-bold">
                  {viewingAnalysis.patient.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{viewingAnalysis.patient}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">ID: LAB-{viewingAnalysis.id.padStart(4, '0')}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {getPatientDetails(patients, viewingAnalysis.patient)?.department || 'Service non renseigne'} • Chambre {getPatientDetails(patients, viewingAnalysis.patient)?.room || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type d'analyse</p>
                  <p className="text-sm font-bold text-slate-900">{viewingAnalysis.test}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-bold text-slate-900">{viewingAnalysis.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block",
                    viewingAnalysis.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                  )}>
                    {viewingAnalysis.status === 'Completed' ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Résultat</p>
                  <p className={cn(
                    "text-sm font-bold",
                    viewingAnalysis.result === 'Élevé' ? "text-red-600" : 
                    viewingAnalysis.result === 'Négatif' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {viewingAnalysis.result}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900">Contexte analytique</h4>
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border',
                    getAnalysisDetails(viewingAnalysis).priority === 'Stat' ? 'bg-red-50 text-red-600 border-red-100' :
                    getAnalysisDetails(viewingAnalysis).priority === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  )}>
                    {getAnalysisDetails(viewingAnalysis).priority}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Échantillon:</span> {getAnalysisDetails(viewingAnalysis).sampleType}</p>
                  <p><span className="font-semibold text-slate-900">Prescripteur:</span> {getAnalysisDetails(viewingAnalysis).orderedBy}</p>
                  <p><span className="font-semibold text-slate-900">Délai:</span> {getAnalysisDetails(viewingAnalysis).turnaround}</p>
                  <p><span className="font-semibold text-slate-900">Service:</span> {getAnalysisDetails(viewingAnalysis).department}</p>
                  <p><span className="font-semibold text-slate-900">Prélèvement:</span> {getAnalysisDetails(viewingAnalysis).collectedAt}</p>
                  <p><span className="font-semibold text-slate-900">Validation:</span> {getAnalysisDetails(viewingAnalysis).reportedAt || '-'}</p>
                  <p><span className="font-semibold text-slate-900">Methode:</span> {getAnalysisDetails(viewingAnalysis).methodology}</p>
                  <p><span className="font-semibold text-slate-900">Automate:</span> {getAnalysisDetails(viewingAnalysis).analyzer}</p>
                  <p><span className="font-semibold text-slate-900">Biologiste:</span> {getAnalysisDetails(viewingAnalysis).biologist}</p>
                  <p><span className="font-semibold text-slate-900">Etat echantillon:</span> {getAnalysisDetails(viewingAnalysis).specimenCondition}</p>
                  <p><span className="font-semibold text-slate-900">Groupe sanguin:</span> {getPatientDetails(patients, viewingAnalysis.patient)?.bloodType || '-'}</p>
                  <p><span className="font-semibold text-slate-900">Statut patient:</span> {getPatientDetails(patients, viewingAnalysis.patient)?.status || '-'}</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {viewingAnalysis.notes || getAnalysisDetails(viewingAnalysis).notes}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Valeurs détaillées</h4>
                {getAnalysisDetails(viewingAnalysis).metrics.length > 0 ? (
                  <div className="space-y-3">
                    {getAnalysisDetails(viewingAnalysis).metrics.map((metric, index) => (
                      <div key={`${metric.label}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paramètre</p>
                          <p className="text-sm font-bold text-slate-900">{metric.label}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valeur</p>
                          <p className="text-sm text-slate-700">{metric.value}{metric.unit ? ` ${metric.unit}` : ''}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Référence</p>
                          <p className="text-sm text-slate-700">{metric.reference || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interprétation</p>
                          <p className={cn(
                            'text-sm font-bold',
                            metric.interpretation === 'high' || metric.interpretation === 'alert' ? 'text-red-600' :
                            metric.interpretation === 'low' ? 'text-amber-600' :
                            'text-emerald-600'
                          )}>
                            {metric.interpretation === 'high' ? 'Élevé' :
                             metric.interpretation === 'low' ? 'Bas' :
                             metric.interpretation === 'alert' ? 'À valider' :
                             'Normal'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Aucune valeur détaillée enregistrée pour cette analyse.</p>
                )}
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  onClick={() => handleDownloadReport(viewingAnalysis)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Imprimer
                </button>
                <button 
                  onClick={() => setViewingAnalysis(null)}
                  className="flex-1 py-3 bg-hospital-blue-600 text-white font-bold rounded-xl hover:bg-hospital-blue-700 shadow-lg shadow-hospital-blue-100 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {analysisToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setAnalysisToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-lg font-bold">Confirmer la suppression</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'analyse de <strong>{analysisToDelete.patient}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAnalysisToDelete(null)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDeleteAnalysis(analysisToDelete.id)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
