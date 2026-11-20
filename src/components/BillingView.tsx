import React, { useState } from 'react';
import { 
  CreditCard, 
  Download, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Save,
  Trash2,
  Pencil
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Patient } from '../types';

interface Invoice {
  id: string;
  patient: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Unpaid';
  insurance?: string;
}

interface InsurancePartner {
  id: string;
  name: string;
  coverageRate: number;
  contact: string;
  totalReimbursed: number;
  pendingReimbursement: number;
}

const initialPartners: InsurancePartner[] = [
  { id: '1', name: 'AMO', coverageRate: 70, contact: 'contact@amo.ma', totalReimbursed: 45000, pendingReimbursement: 12000 },
  { id: '2', name: 'CNOPS', coverageRate: 80, contact: 'info@cnops.org.ma', totalReimbursed: 85000, pendingReimbursement: 25000 },
  { id: '3', name: 'CNSS', coverageRate: 70, contact: 'support@cnss.ma', totalReimbursed: 120000, pendingReimbursement: 45000 },
  { id: '4', name: 'Mutuelle des FAR', coverageRate: 100, contact: 'far@mutuelle.ma', totalReimbursed: 30000, pendingReimbursement: 5000 },
];

const initialInvoices: Invoice[] = [
  { id: 'INV-001', patient: 'Ahmed Alaoui', amount: 4200.00, date: '2026-05-12', status: 'Paid', insurance: 'CNOPS' },
  { id: 'INV-002', patient: 'Youssef Benali', amount: 1850.00, date: '2026-05-10', status: 'Pending', insurance: 'AMO' },
  { id: 'INV-003', patient: 'Omar Tazi', amount: 9800.00, date: '2026-05-15', status: 'Unpaid', insurance: 'Sans Assurance' },
  { id: 'INV-004', patient: 'Lina Chraibi', amount: 7600.00, date: '2026-05-13', status: 'Paid', insurance: 'CNSS' },
];

interface BillingViewProps {
  patients: Patient[];
}

const insurancePartners = ['AMO', 'CNOPS', 'CNSS', 'Mutuelle des FAR'];

export const BillingView: React.FC<BillingViewProps> = ({ patients }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [partners, setPartners] = useState<InsurancePartner[]>(initialPartners);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Unpaid'>('All');
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [editingPartner, setEditingPartner] = useState<InsurancePartner | null>(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    coverageRate: '',
    contact: ''
  });
  const [newInvoice, setNewInvoice] = useState({
    patientName: '',
    patientCIN: '',
    amount: '',
    status: 'Pending' as 'Paid' | 'Pending' | 'Unpaid',
    insurance: 'Sans Assurance'
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesVisiblePatients = patients.some(patient => inv.patient.includes(patient.name));
    if (!matchesVisiblePatients) return false;

    const matchesSearch = 
      inv.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.insurance?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (filteredInvoices.length === 0) return;

    const headers = ["N° Facture", "Patient", "Assurance", "Date", "Montant (DH)", "Statut"];
    const rows = filteredInvoices.map(inv => [
      `"${inv.id}"`,
      `"${inv.patient}"`,
      `"${inv.insurance || ''}"`,
      `"${inv.date}"`,
      inv.amount.toFixed(2),
      `"${inv.status === 'Paid' ? 'Payé' : inv.status === 'Pending' ? 'En attente' : 'Impayé'}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `factures_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.coverageRate) return;

    const partner: InsurancePartner = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPartner.name,
      coverageRate: Number(newPartner.coverageRate),
      contact: newPartner.contact,
      totalReimbursed: 0,
      pendingReimbursement: 0
    };

    setPartners([...partners, partner]);
    setNewPartner({ name: '', coverageRate: '', contact: '' });
    setShowAddPartner(false);
  };

  const handleUpdatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    setPartners(partners.map(p => p.id === editingPartner.id ? editingPartner : p));
    setEditingPartner(null);
  };

  const handleDeletePartner = (id: string) => {
    setPartners(partners.filter(p => p.id !== id));
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.patientName || !newInvoice.patientCIN) return;

    const invoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 900) + 100}`,
      patient: `${newInvoice.patientName} (CIN: ${newInvoice.patientCIN})`,
      amount: Number(newInvoice.amount),
      date: new Date().toISOString().split('T')[0],
      status: newInvoice.status,
      insurance: newInvoice.insurance
    };

    setInvoices([invoice, ...invoices]);
    setShowAddInvoice(false);
    setNewInvoice({ patientName: '', patientCIN: '', amount: '', status: 'Pending', insurance: 'Sans Assurance' });
  };

  const handleToggleStatus = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const nextStatus: Record<string, 'Paid' | 'Pending' | 'Unpaid'> = {
          'Unpaid': 'Pending',
          'Pending': 'Paid',
          'Paid': 'Unpaid'
        };
        return { ...inv, status: nextStatus[inv.status] };
      }
      return inv;
    }));
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const totalRevenue = invoices.reduce((acc, inv) => inv.status === 'Paid' ? acc + inv.amount : acc, 0);
  const totalPending = invoices.reduce((acc, inv) => inv.status === 'Pending' ? acc + inv.amount : acc, 0);
  const totalUnpaid = invoices.reduce((acc, inv) => inv.status === 'Unpaid' ? acc + inv.amount : acc, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Facturation</h2>
          <p className="text-slate-500">Gestion des paiements, factures et assurances.</p>
        </div>
        <button 
          onClick={() => setShowAddInvoice(true)}
          className="btn-primary"
        >
          <Plus size={20} />
          Nouvelle Facture
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 bg-hospital-blue-600 text-white shadow-lg shadow-hospital-blue-100">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-blue-100 text-sm font-medium">Revenus du mois</p>
              <h3 className="text-3xl font-bold">{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase text-blue-200 font-bold mb-1">En attente</p>
              <p className="text-lg font-bold">{totalPending.toLocaleString('fr-FR')} DH</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase text-blue-200 font-bold mb-1">Impayés</p>
              <p className="text-lg font-bold">{totalUnpaid.toLocaleString('fr-FR')} DH</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Modes de Paiement</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">Carte Bancaire</span>
              <span className="font-bold text-slate-900">65%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">Virement</span>
              <span className="font-bold text-slate-900">20%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">Espèces</span>
              <span className="font-bold text-slate-900">15%</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Assurances Partenaires</h3>
          <div className="flex flex-wrap gap-2">
            {partners.map(ins => (
              <span key={ins.id} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{ins.name}</span>
            ))}
          </div>
          <button 
            onClick={() => setShowPartnersModal(true)}
            className="w-full mt-6 py-2 text-sm font-bold text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-xl transition-colors"
          >
            Gérer les conventions
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une facture..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-hospital-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Tous les statuts</option>
                <option value="Paid">Payé</option>
                <option value="Pending">En attente</option>
                <option value="Unpaid">Impayé</option>
              </select>
            </div>
            <button 
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Assurance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{inv.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 font-medium">{inv.patient}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                      inv.insurance === 'Sans Assurance' ? "bg-slate-100 text-slate-500" : "bg-hospital-blue-50 text-hospital-blue-600"
                    )}>
                      {inv.insurance}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{inv.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{inv.amount.toFixed(2)} DH</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(inv.id)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {inv.status === 'Paid' && <CheckCircle2 size={14} className="text-emerald-500" />}
                      {inv.status === 'Pending' && <Clock size={14} className="text-amber-500" />}
                      {inv.status === 'Unpaid' && <AlertCircle size={14} className="text-red-500" />}
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        inv.status === 'Paid' ? "text-emerald-600" : 
                        inv.status === 'Pending' ? "text-amber-600" : "text-red-600"
                      )}>
                        {inv.status === 'Paid' ? 'Payé' : inv.status === 'Pending' ? 'En attente' : 'Impayé'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded-lg transition-all" title="Télécharger">
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    Aucune facture trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Nouvelle Facture</h3>
              <button 
                onClick={() => setShowAddInvoice(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddInvoice} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nom Complet du Patient</label>
                <input 
                  required
                  type="text"
                  value={newInvoice.patientName}
                  onChange={(e) => setNewInvoice({...newInvoice, patientName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  placeholder="Ex: Ahmed Alaoui"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">ID CIN</label>
                <input 
                  required
                  type="text"
                  value={newInvoice.patientCIN}
                  onChange={(e) => setNewInvoice({...newInvoice, patientCIN: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                  placeholder="Ex: AB123456"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Montant (DH)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                    placeholder="Ex: 125.50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assurance</label>
                <select 
                  value={newInvoice.insurance}
                  onChange={(e) => setNewInvoice({...newInvoice, insurance: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="Sans Assurance">Sans Assurance</option>
                  {partners.map(ins => (
                    <option key={ins.id} value={ins.name}>{ins.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Statut Initial</label>
                <select 
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice({...newInvoice, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-hospital-blue-500 outline-none transition-all"
                >
                  <option value="Pending">En attente</option>
                  <option value="Paid">Payé</option>
                  <option value="Unpaid">Impayé</option>
                </select>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-hospital-blue-600 text-white rounded-2xl font-bold hover:bg-hospital-blue-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-hospital-blue-100"
              >
                <Save size={20} />
                Créer la Facture
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Partners Management Modal */}
      {showPartnersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Conventions & Assurances</h3>
                <p className="text-xs text-slate-500">Gérez vos partenaires et suivez les remboursements.</p>
              </div>
              <button 
                onClick={() => {
                  setShowPartnersModal(false);
                  setShowAddPartner(false);
                  setEditingPartner(null);
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Remboursé</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {partners.reduce((acc, p) => acc + p.totalReimbursed, 0).toLocaleString('fr-FR')} DH
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">En attente de remboursement</p>
                  <p className="text-xl font-bold text-amber-700">
                    {partners.reduce((acc, p) => acc + p.pendingReimbursement, 0).toLocaleString('fr-FR')} DH
                  </p>
                </div>
                <div className="p-4 bg-hospital-blue-50 border border-hospital-blue-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-hospital-blue-600 uppercase tracking-wider mb-1">Partenaires Actifs</p>
                  <p className="text-xl font-bold text-hospital-blue-700">{partners.length}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900">Liste des Partenaires</h4>
                <button 
                  onClick={() => setShowAddPartner(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-hospital-blue-600 text-white rounded-lg text-xs font-bold hover:bg-hospital-blue-700 transition-all"
                >
                  <Plus size={14} />
                  Nouveau Partenaire
                </button>
              </div>

              {(showAddPartner || editingPartner) && (
                <form 
                  onSubmit={editingPartner ? handleUpdatePartner : handleAddPartner}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-300"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nom</label>
                      <input 
                        required
                        type="text"
                        value={editingPartner ? editingPartner.name : newPartner.name}
                        onChange={(e) => editingPartner 
                          ? setEditingPartner({...editingPartner, name: e.target.value})
                          : setNewPartner({...newPartner, name: e.target.value})
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500"
                        placeholder="Ex: AMO"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Taux de Couverture (%)</label>
                      <input 
                        required
                        type="number"
                        value={editingPartner ? editingPartner.coverageRate : newPartner.coverageRate}
                        onChange={(e) => editingPartner 
                          ? setEditingPartner({...editingPartner, coverageRate: Number(e.target.value)})
                          : setNewPartner({...newPartner, coverageRate: e.target.value})
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500"
                        placeholder="Ex: 70"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Contact / Email</label>
                      <input 
                        required
                        type="email"
                        value={editingPartner ? editingPartner.contact : newPartner.contact}
                        onChange={(e) => editingPartner 
                          ? setEditingPartner({...editingPartner, contact: e.target.value})
                          : setNewPartner({...newPartner, contact: e.target.value})
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-hospital-blue-500"
                        placeholder="Ex: contact@amo.ma"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAddPartner(false);
                        setEditingPartner(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-hospital-blue-600 text-white rounded-lg text-xs font-bold hover:bg-hospital-blue-700 transition-all flex items-center gap-2"
                    >
                      <Save size={14} />
                      {editingPartner ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partenaire</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Couverture</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remboursé</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">En attente</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-hospital-blue-50 text-hospital-blue-600 rounded text-[10px] font-bold">
                            {p.coverageRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-500">{p.contact}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-emerald-600">{p.totalReimbursed.toLocaleString('fr-FR')} DH</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-amber-600">{p.pendingReimbursement.toLocaleString('fr-FR')} DH</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingPartner(p)}
                              className="p-1.5 text-slate-400 hover:text-hospital-blue-600 hover:bg-hospital-blue-50 rounded transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeletePartner(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
