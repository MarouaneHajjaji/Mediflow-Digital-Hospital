import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  FlaskConical, 
  Image as ImageIcon, 
  Bed, 
  CreditCard, 
  Archive,
  Shield,
  LogOut,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: View;
  viewHistory: View[];
  currentDoctorName?: string;
  currentSpecialty?: string;
  isAdmin?: boolean;
  onViewChange: (view: View, search?: string) => void;
  onLogoutRequest: () => void;
}

type MenuItem = {
  id: View;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'admin', label: 'Administration', icon: Shield, adminOnly: true },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
  { id: 'emr', label: 'Dossier Médical', icon: FileText },
  { id: 'lab', label: 'Laboratoire', icon: FlaskConical },
  { id: 'imaging', label: 'Imagerie', icon: ImageIcon },
  { id: 'hospitalization', label: 'Hospitalisation', icon: Bed },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'archive', label: 'Archives', icon: Archive },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ currentView, viewHistory, currentDoctorName, currentSpecialty, isAdmin, onViewChange, onLogoutRequest }) => {
  const getViewLabel = (viewId: string) => {
    const item = menuItems.find(m => m.id === viewId);
    if (item) return item.label;
    if (viewId === 'settings') return 'Paramètres';
    return viewId;
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 transition-colors duration-300 z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-hospital-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-hospital-blue-600/20">
          <Stethoscope size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">MediFlow</h1>
          {currentDoctorName && <p className="text-[10px] font-bold uppercase tracking-wider text-hospital-blue-600">{currentDoctorName} | {currentSpecialty}</p>}
        </div>
      </div>

      {/* Breadcrumb / Navigation Path */}
      <div className="px-6 mb-6">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {viewHistory.map((viewId, index) => (
              <React.Fragment key={viewId}>
                {index > 0 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                <button
                  onClick={() => onViewChange(viewId)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-hospital-blue-600",
                    index === viewHistory.length - 1 ? "text-hospital-blue-600" : "text-slate-400"
                  )}
                >
                  {getViewLabel(viewId)}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-2">Menu Principal</p>
        {menuItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "sidebar-item w-full",
              currentView === item.id && "sidebar-item-active"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogoutRequest}
          className="sidebar-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
