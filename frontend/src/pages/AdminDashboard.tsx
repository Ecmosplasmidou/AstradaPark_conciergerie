import React, { useEffect, useState } from 'react';
import { Car, Search, Info, AlertTriangle, X, Shield, Users, ParkingCircle, Receipt, Download, MessageSquare, CheckCircle2, Send, Filter, Calendar as CalendarIcon, Trash2, Table2, UserCircle, Mail, CreditCard, ChevronDown, UserPlus, Sun, Moon } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

const AdminDashboard = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedCar, setSelectedCar] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'parking' | 'invoices' | 'recap' | 'clients' | 'messages'>('parking');
  const [clientSearch, setClientSearch] = useState('');
  
  // Nouveaux états de filtres de factures
  const [invoiceFilterName, setInvoiceFilterName] = useState('');
  const [invoiceFilterCar, setInvoiceFilterCar] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState('all');

  // Nouveaux états de messagerie
  const [messages, setMessages] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState<{[key: string]: string}>({});
  const [isReplying, setIsReplying] = useState<string | null>(null);
  const [messageFilterStatus, setMessageFilterStatus] = useState<'all'|'nouveau'|'traité'|'clôturé'>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignEndDate, setAssignEndDate] = useState('');
  const [adhesionAmount, setAdhesionAmount] = useState<0 | 100 | 200>(200);
  const [mensuelAmount, setMensuelAmount] = useState<number>(240);
  const [cautionAmount, setCautionAmount] = useState<number>(240);

  // État édition client (modal) + expansion factures
  const [editingClientUser, setEditingClientUser] = useState<any | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Light mode
  const [lightMode, setLightMode] = useState(() => localStorage.getItem('lightMode') === 'true');

  // État ajout client
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [addClientForm, setAddClientForm] = useState({ nom: '', prenom: '', email: '', password: '', cars: [] as { model: string; plate: string; bipNumber: string }[] });
  const [editClientForm, setEditClientForm] = useState<{ nom: string; prenom: string; mandat: string; immeuble: string; cars: { model: string; plate: string; bipNumber: string }[] }>({ nom: '', prenom: '', mandat: '', immeuble: '', cars: [] });

  // État édition inline récap (cellule par cellule)
  const [editingCell, setEditingCell] = useState<{
    rowKey: string;
    field: string; // 'nom' | 'prenom' | 'adhesion' | monthKey ('YYYY-MM')
    slotNumber: number;
    clientEmail: string;
    clientNom: string | null;
    clientPrenom: string | null;
    inv?: any; // facture cible pour adhesion/month
  } | null>(null);
  const [editCellValue, setEditCellValue] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [parkingRes, usersRes] = await Promise.all([
        api.get('/parking'),
        api.get('/auth/users')
      ]);
      setSlots(parkingRes.data);
      setUsers(usersRes.data);
      setLoading(false);
      fetchInvoices();
      fetchMessages();
    } catch (error) { console.error(error); }
  };

  const isCarAlreadyAssigned = (car: { plate?: string; model?: string }): boolean => {
    return slots.some(s => {
      if (s.status !== 'occupé') return false;
      if (car.plate && s.licensePlate === car.plate) return true;
      if (car.model && selectedUser?.email && s.email === selectedUser.email && s.carModel === car.model) return true;
      return false;
    });
  };

  const handleAssign = async () => {
    if (!selectedSlot || !selectedUser || !selectedCar) return;
    if (isCarAlreadyAssigned(selectedCar)) {
      alert(`Le véhicule ${selectedCar.plate || selectedCar.model} est déjà assigné à une place. Libérez-la d'abord.`);
      return;
    }
    try {
      await api.patch(`/parking/${selectedSlot.number}`, {
        status: 'occupé',
        nom: selectedUser.nom,
        prenom: selectedUser.prenom,
        userId: selectedUser._id,
        email: selectedUser.email,
        carModel: selectedCar.model,
        licensePlate: selectedCar.plate,
        startDate: assignStartDate,
        endDate: assignEndDate || null,
        adhesionAmount,
        mensuelAmount,
        cautionAmount,
      });
      resetSelection();
      fetchData();
    } catch (err) { alert("Erreur d'attribution"); }
  };

  const handleUpdateEndDate = async (newEndDate: string) => {
    if (!selectedSlot) return;
    try {
      await api.patch(`/parking/${selectedSlot.number}`, {
        status: 'occupé',
        endDate: newEndDate || null
      });
      fetchData();
      alert("Date de fin mise à jour");
    } catch(err) {
      alert("Erreur de mise à jour");
    }
  };

  const resetSelection = () => {
    setSelectedSlot(null); setSelectedUser(null); setSelectedCar(null); setSearchTerm('');
    setAssignStartDate(new Date().toISOString().split('T')[0]);
    setAssignEndDate('');
    setAdhesionAmount(200);
  };

  const filteredUsers = searchTerm.length > 0 ? users.filter(u => u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) { console.error('Erreur factures', error); }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data);
    } catch (error) { console.error('Erreur messages', error); }
  };

  const handleUpdateMessageStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/messages/${id}`, { status });
      fetchMessages();
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleReplyMessage = async (id: string) => {
    if (!replyContent[id]?.trim()) return;
    setIsReplying(id);
    try {
      await api.post(`/messages/${id}/reply`, { content: replyContent[id] });
      setReplyContent(prev => ({...prev, [id]: ''}));
      // On le passe aussi en traité automatiquement si ce n'est pas déjà le cas
      const msg = messages.find(m => m._id === id);
      if (msg && msg.status === 'nouveau') {
        await api.patch(`/messages/${id}`, { status: 'traité' });
      }
      fetchMessages();
    } catch (error) {
      alert("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(null);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;
    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
    } catch (error) {
      alert("Erreur lors de la suppression du message");
    }
  };

  const handleSecondMonthPDF = (inv: any) => {
    const ref = new Date(inv.periodStart);
    const y = ref.getFullYear();
    const m = ref.getMonth(); // 0-indexed
    const nextYear = m === 11 ? y + 1 : y;
    const nextMonth = (m + 1) % 12; // 0-indexed
    const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const periodStart = `${nextYear}-${pad(nextMonth + 1)}-01`;
    const periodEnd = `${nextYear}-${pad(nextMonth + 1)}-${pad(lastDay)}`;
    const invUser = users.find((u: any) => u.email === inv.clientEmail);
    generateInvoicePDF({
      ...inv,
      invoiceNumber: `${inv.invoiceNumber}-M2`,
      amount: inv.mensuelAmount ?? 240,
      periodStart,
      periodEnd,
      isFirstMonth: false,
      mandat: invUser?.mandat,
      immeuble: invUser?.immeuble,
    });
  };

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!window.confirm(`Supprimer la facture ${invoiceNumber} ?`)) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (error) {
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    const { field, slotNumber, clientEmail, clientNom, clientPrenom, inv } = editingCell;
    try {
      if (field === 'nom' || field === 'prenom') {
        await api.patch('/invoices/update-client-name', {
          slotNumber,
          clientEmail,
          clientNom: field === 'nom' ? editCellValue.trim() : (clientNom ?? ''),
          clientPrenom: field === 'prenom' ? editCellValue.trim() : (clientPrenom ?? ''),
        });
      } else if (field === 'adhesion') {
        if (inv) {
          const newAdhesion = parseFloat(editCellValue) || 0;
          const delta = newAdhesion - (inv.adhesionAmount ?? 200);
          await api.patch(`/invoices/${inv._id}`, {
            adhesionAmount: newAdhesion,
            amount: parseFloat((inv.amount + delta).toFixed(2)),
          });
        }
      } else {
        // field = monthKey ('YYYY-MM')
        if (inv) {
          const newMensuelNet = parseFloat(editCellValue) || 0;
          const newAmount = inv.isFirstMonth
            ? parseFloat((newMensuelNet + (inv.adhesionAmount ?? 200)).toFixed(2))
            : newMensuelNet;
          await api.patch(`/invoices/${inv._id}`, { amount: newAmount });
        }
      }
      setEditingCell(null);
      fetchInvoices();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteRecapRow = async (slotNumber: number, clientEmail: string, nom: string, prenom: string) => {
    if (!window.confirm(`Supprimer toutes les factures de ${prenom} ${nom} pour la place #${slotNumber} ?`)) return;
    try {
      await api.delete('/invoices/by-client', { data: { slotNumber, clientEmail } });
      fetchInvoices();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleExportInvoiceCSV = (inv: any) => {
    const ht = Number(inv.amount ?? 0);
    const tva = parseFloat((ht * 0.20).toFixed(2));
    const ttc = parseFloat((ht * 1.20).toFixed(2));
    const headers = [
      'N° Facture', 'Nom', 'Prénom', 'Email', 'Place', 'Véhicule', 'Plaque',
      'Période début', 'Période fin', 'Type', 'Premier mois',
      'Montant HT (€)', 'TVA 20% (€)', 'Montant TTC (€)',
      'Adhésion HT (€)', 'Caution HT (€)', 'Mensuel HT (€)',
    ];
    const row = [
      inv.invoiceNumber ?? '',
      inv.clientNom ?? '',
      inv.clientPrenom ?? '',
      inv.clientEmail ?? '',
      inv.slotNumber ?? '',
      inv.carModel ?? '',
      inv.licensePlate ?? '',
      inv.periodStart ?? '',
      inv.periodEnd ?? '',
      inv.type ?? '',
      inv.isFirstMonth ? 'Oui' : 'Non',
      ht.toFixed(2),
      tva.toFixed(2),
      ttc.toFixed(2),
      (inv.adhesionAmount ?? '').toString(),
      (inv.cautionAmount ?? '').toString(),
      (inv.mensuelAmount ?? '').toString(),
    ];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, row].map(r => r.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoiceNumber ?? 'facture'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRecapExcel = () => {
    const OWNER_SLOT = 30;
    const mensuelNet = (inv: any) => inv.isFirstMonth
      ? parseFloat((inv.amount - (inv.adhesionAmount ?? 200)).toFixed(2))
      : (inv.amount as number);

    const monthKeys = Array.from(new Set(invoices.map(inv => inv.periodStart.slice(0, 7)))).sort() as string[];
    const monthLabel = (key: string) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    const invBySlot: Record<number, any[]> = {};
    invoices.forEach(inv => {
      if (!invBySlot[inv.slotNumber]) invBySlot[inv.slotNumber] = [];
      invBySlot[inv.slotNumber].push(inv);
    });

    // Construire les lignes
    const rows: any[][] = [];
    const header = ['N°', 'Nom', 'Prénom', 'Adhésion HT (€)', ...monthKeys.map(monthLabel), 'Total HT (€)', 'TVA 20% (€)', 'Total TTC (€)'];
    rows.push(header);

    slots.forEach(slot => {
      const isOwner = slot.number === OWNER_SLOT;
      const slotInvs = invBySlot[slot.number] || [];

      if (isOwner) {
        rows.push([`#${slot.number}`, slot.nom ?? '', slot.prenom ?? '', '', ...monthKeys.map(() => ''), 0, 0, 0]);
        return;
      }

      if (slotInvs.length === 0) {
        rows.push([`#${slot.number}`, slot.status === 'occupé' ? (slot.nom ?? '') : 'Disponible', slot.status === 'occupé' ? (slot.prenom ?? '') : '', '', ...monthKeys.map(() => ''), '', '', '']);
        return;
      }

      const byClient: Record<string, any[]> = {};
      slotInvs.forEach((inv: any) => {
        if (!byClient[inv.clientEmail]) byClient[inv.clientEmail] = [];
        byClient[inv.clientEmail].push(inv);
      });

      Object.entries(byClient).forEach(([email, clientInvs]) => {
        const ref = clientInvs[0];
        const firstInv = clientInvs.find((i: any) => i.isFirstMonth);
        const adhesion = firstInv?.adhesionAmount ?? null;
        const totalHT = clientInvs.reduce((s: number, inv: any) => s + mensuelNet(inv), 0);
        const tva = parseFloat((totalHT * 0.20).toFixed(2));
        const ttc = parseFloat((totalHT * 1.20).toFixed(2));
        const hasLeft = slot.status !== 'occupé' || slot.email !== email;
        const nomCell = `${ref.clientNom}${hasLeft ? ' (parti)' : ''}`;
        const monthCells = monthKeys.map(key => {
          const inv = clientInvs.find((i: any) => i.periodStart.slice(0, 7) === key);
          return inv ? mensuelNet(inv) : '';
        });
        rows.push([`#${slot.number}`, nomCell, ref.clientPrenom ?? '', adhesion ?? '', ...monthCells, totalHT, tva, ttc]);
      });
    });

    // Ligne de totaux
    const grandTotalHT = invoices.filter(inv => inv.slotNumber !== OWNER_SLOT).reduce((s: number, inv: any) => s + mensuelNet(inv), 0);
    const grandTVA = parseFloat((grandTotalHT * 0.20).toFixed(2));
    const grandTTC = parseFloat((grandTotalHT * 1.20).toFixed(2));
    const monthTotals = monthKeys.map(key =>
      invoices.filter((inv: any) => inv.periodStart.slice(0, 7) === key && inv.slotNumber !== OWNER_SLOT)
        .reduce((s: number, inv: any) => s + mensuelNet(inv), 0)
    );
    rows.push(['TOTAUX', '', '', '', ...monthTotals, grandTotalHT, grandTVA, grandTTC]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Largeurs de colonnes
    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, ...monthKeys.map(() => ({ wch: 14 })), { wch: 13 }, { wch: 12 }, { wch: 13 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Récap Annuel');
    const year = new Date().getFullYear();
    XLSX.writeFile(wb, `recap-astrada-${year}.xlsx`);
  };

  const handleAddClient = async () => {
    if (!addClientForm.nom || !addClientForm.prenom || !addClientForm.email || !addClientForm.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await api.post('/auth/signup', addClientForm);
      setShowAddClientModal(false);
      setAddClientForm({ nom: '', prenom: '', email: '', password: '', cars: [] });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur lors de la création du client');
    }
  };

  const handleDeleteUser = async (id: string, nom: string, prenom: string) => {
    if (!window.confirm(`Supprimer le client ${prenom} ${nom} ?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la suppression du client');
    }
  };

  const openEditClient = (u: any) => {
    setEditingClientUser(u);
    setEditClientForm({
      nom: u.nom ?? '',
      prenom: u.prenom ?? '',
      mandat: u.mandat ?? '',
      immeuble: u.immeuble ?? '',
      cars: u.cars ? u.cars.map((c: any) => ({ model: c.model ?? '', plate: c.plate ?? '', bipNumber: c.bipNumber ?? '' })) : [],
    });
  };

  const handleSaveClientEdit = async () => {
    if (!editingClientUser) return;
    try {
      await api.patch(`/auth/users/${editingClientUser._id}`, editClientForm);
      setEditingClientUser(null);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  // Calcul des statistiques
  const totalOccupied = slots.filter(s => s.status === 'occupé').length;
  const totalAvailable = slots.filter(s => s.status === 'disponible').length;

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 100%)' }}>
      <div className="text-center">
        <div className="gold-shimmer text-2xl font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Playfair Display', serif" }}>KELVAL SARL</div>
        <p className="text-[#D4A853]/40 text-xs uppercase tracking-widest mt-2 animate-pulse">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-500" style={{ background: lightMode ? '#FFFFFF' : 'linear-gradient(180deg, #0A0A0A 0%, #111118 50%, #0F0F0F 100%)' }}>
      <div className="max-w-[1800px] mx-auto">

        {/* MODALE DE LIBERATION */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 border border-[#D4A853]/15 animate-fade-in-up" style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #111 100%)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Libérer la place</h3>
                <p className="text-[#D4A853] text-3xl font-black mt-2">#{showConfirmModal}</p>
              </div>
              <p className="text-neutral-500 text-xs">Cette action révoquera l'accès du véhicule actuellement stationné.</p>
              <button onClick={async () => {
                await api.patch(`/parking/${showConfirmModal}`, {
                    status: 'disponible',
                    nom: null,
                    prenom: null,
                    userId: null,
                    email: null,
                    carModel: null,
                    licensePlate: null
                });
                setShowConfirmModal(null); fetchData();
              }} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/30">
                Confirmer la libération
              </button>
              <button onClick={() => setShowConfirmModal(null)} className="text-neutral-500 font-semibold text-xs uppercase tracking-widest hover:text-white transition-colors">Annuler</button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="mb-6 sm:mb-10 flex flex-col gap-4 sm:gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[#D4A853]/60" />
                <p className="text-[#D4A853]/60 font-semibold text-[10px] uppercase tracking-[0.3em]">Panneau d'Administration</p>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Gestion des <span className="text-[#D4A853]">Emplacements</span>
              </h1>
            </div>
            <button
              onClick={() => { const next = !lightMode; setLightMode(next); localStorage.setItem('lightMode', String(next)); }}
              title={lightMode ? 'Mode sombre' : 'Mode clair'}
              className="h-10 w-10 rounded-xl flex items-center justify-center border transition-all shrink-0 mt-1 bg-white/5 border-white/10 text-white/50 hover:text-[#D4A853] hover:border-[#D4A853]/30"
            >
              {lightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          {/* SECTION STATISTIQUES */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 border border-emerald-500/15 flex-1 min-w-[120px]" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500/10 text-emerald-400 rounded-lg sm:rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                <ParkingCircle size={20}/>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-emerald-400/70 uppercase tracking-widest">Disponibles</p>
                <p className="text-lg sm:text-xl font-black text-emerald-400">{totalAvailable}</p>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 border border-[#D4A853]/15 flex-1 min-w-[120px]" style={{ background: 'rgba(212, 168, 83, 0.05)' }}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-[#D4A853]/10 text-[#D4A853] rounded-lg sm:rounded-xl flex items-center justify-center border border-[#D4A853]/20 shrink-0">
                <Car size={20}/>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-[#D4A853]/70 uppercase tracking-widest">Occupées</p>
                <p className="text-lg sm:text-xl font-black text-[#D4A853]">{totalOccupied}</p>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 border border-white/5 flex-1 min-w-[120px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/5 text-white/40 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <Users size={20}/>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">Clients</p>
                <p className="text-lg sm:text-xl font-black text-white/70">{users.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ONGLETS */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('parking')} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === 'parking' ? 'gold-gradient text-[#0A0A0A]' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
          }`}>
            <ParkingCircle size={14} className="inline mr-2 -mt-0.5" />Emplacements
          </button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === 'invoices' ? 'gold-gradient text-[#0A0A0A]' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
          }`}>
            <Receipt size={14} className="inline mr-2 -mt-0.5" />Factures ({invoices.length})
          </button>
          <button onClick={() => setActiveTab('recap')} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === 'recap' ? 'gold-gradient text-[#0A0A0A]' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
          }`}>
            <Table2 size={14} className="inline mr-2 -mt-0.5" />Récap Annuel
          </button>
          <button onClick={() => setActiveTab('clients')} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === 'clients' ? 'gold-gradient text-[#0A0A0A]' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
          }`}>
            <Users size={14} className="inline mr-2 -mt-0.5" />Clients ({users.filter((u: any) => u.role !== 'admin').length})
          </button>
          <button onClick={() => setActiveTab('messages')} className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap relative ${
            activeTab === 'messages' ? 'gold-gradient text-[#0A0A0A]' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'
          }`}>
            <MessageSquare size={14} className="inline mr-2 -mt-0.5" />Messages
            {messages.filter(m => m.status === 'nouveau').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-[#111118] text-[8px] text-white font-black animate-pulse shadow-lg shadow-rose-500/50">
                {messages.filter(m => m.status === 'nouveau').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="ml-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 bg-white/5 text-white/50 hover:text-white/80 border border-white/10 hover:border-[#D4A853]/30 hover:bg-[#D4A853]/10 shrink-0"
          >
            <UserPlus size={13} />Ajouter un client
          </button>
        </div>

        {activeTab === 'parking' ? (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* GRILLE DES PLACES */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {slots.map(slot => (
              <div 
                key={slot.number} 
                onClick={() => slot.number !== 30 && setSelectedSlot(slot)} 
                className={`group rounded-2xl border transition-all duration-300 p-5 cursor-pointer relative overflow-hidden
                  ${slot.status === 'occupé' 
                    ? 'border-[#D4A853]/20 bg-[#D4A853]/[0.03]' 
                    : 'border-white/5 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03]'
                  } 
                  ${selectedSlot?.number === slot.number 
                    ? 'ring-2 ring-[#D4A853]/40 border-[#D4A853]/40 shadow-lg shadow-amber-900/10' 
                    : ''
                  }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-white/80" style={{ fontFamily: "'Playfair Display', serif" }}>#{slot.number}</span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    slot.status === 'occupé' 
                      ? 'bg-[#D4A853]/10 text-[#D4A853] border border-[#D4A853]/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {slot.status === 'occupé' ? 'Occupée' : 'Libre'}
                  </span>
                </div>
                {slot.status === 'occupé' ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-tight">{slot.prenom} {slot.nom}</p>
                    <p className="text-[10px] font-medium text-[#D4A853]/50 italic">{slot.carModel}</p>
                    {slot.licensePlate && <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">{slot.licensePlate}</p>}
                  </div>
                ) : (
                  <div className="text-white/15 font-semibold uppercase text-[9px] tracking-[0.2em] py-3">
                    Disponible
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PANNEAU DE CONTRÔLE — sidebar desktop, bottom sheet mobile */}
          <div className="hidden lg:block w-[400px] xl:w-[420px] shrink-0">
            <div className="rounded-[2rem] border border-[#D4A853]/10 sticky top-20 min-h-[400px] p-6 xl:p-8" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
              {!selectedSlot ? (
                <div className="py-20 text-center">
                  <Info className="mx-auto mb-4 text-[#D4A853]/15" size={48}/>
                  <p className="text-white/20 uppercase text-[10px] font-semibold tracking-[0.2em]">Sélectionnez un emplacement</p>
                </div>
              ) : selectedSlot.status === 'occupé' ? (
                <div className="space-y-8 animate-fade-in-up">
                  <div>
                    <p className="text-[10px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Emplacement occupé</p>
                    <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Place #{selectedSlot.number}</h2>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                    <p className="text-xs font-bold text-white/70 uppercase">{selectedSlot.prenom} {selectedSlot.nom}</p>
                    <p className="text-[10px] text-[#D4A853]/60 italic">{selectedSlot.carModel} — {selectedSlot.licensePlate}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">Depuis le {selectedSlot.startDate}</p>
                    <div className="pt-3 mt-3 border-t border-white/10">
                      <p className="text-[9px] text-[#D4A853]/50 uppercase tracking-widest mb-2">Date de fin prévue</p>
                      <input type="date" defaultValue={selectedSlot.endDate || ''} onChange={e => handleUpdateEndDate(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-[#D4A853]/30" />
                    </div>
                  </div>
                  <button onClick={() => setShowConfirmModal(selectedSlot.number)} className="w-full bg-rose-500/10 text-rose-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                    Révoquer l'accès
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in-up">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-[0.2em] mb-2">Attribution</p>
                    <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Place #{selectedSlot.number}</h2>
                  </div>
                  
                  {!selectedUser ? (
                    <div className="relative group">
                      <Search className="absolute left-5 top-5 text-[#D4A853]/30" size={18}/>
                      <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" placeholder="Rechercher un client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                      {searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[#D4A853]/15 p-2 z-50 max-h-48 overflow-y-auto" style={{ background: '#1A1A1A', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                          {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <div key={u._id} onClick={() => { setSelectedUser(u); setSearchTerm(''); }} className="p-4 hover:bg-[#D4A853]/10 cursor-pointer rounded-xl font-bold text-xs uppercase tracking-tight text-white/70 hover:text-[#D4A853] transition-colors border-b border-white/5 last:border-none">
                              {u.nom} {u.prenom}
                              <span className="block text-[9px] text-white/30 font-normal normal-case mt-0.5">{u.email}</span>
                            </div>
                          )) : (
                            <p className="p-4 text-[10px] text-white/30 text-center">Aucun résultat</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="gold-gradient text-[#0A0A0A] p-5 rounded-2xl flex justify-between items-center animate-fade-in-up">
                        <div>
                          <p className="font-black uppercase text-xs">{selectedUser.nom} {selectedUser.prenom}</p>
                          <p className="text-[9px] font-medium opacity-60 mt-0.5">{selectedUser.email}</p>
                        </div>
                        <button onClick={() => { setSelectedUser(null); setSelectedCar(null); }} className="opacity-60 hover:opacity-100 transition-opacity"><X size={16}/></button>
                      </div>

                      <p className="text-[10px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] ml-1">Sélectionner le véhicule</p>
                      <div className="grid gap-3">
                        {selectedUser.cars.map((car: any, idx: number) => {
                          const alreadyUsed = isCarAlreadyAssigned(car);
                          return (
                            <button key={idx} onClick={() => !alreadyUsed && setSelectedCar({ ...car, _idx: idx })} disabled={alreadyUsed} className={`p-4 rounded-xl border text-left transition-all ${
                              alreadyUsed
                                ? 'opacity-30 cursor-not-allowed border-rose-500/20 bg-rose-500/[0.03]'
                                : selectedCar?._idx === idx
                                  ? 'border-[#D4A853]/40 bg-[#D4A853]/10'
                                  : 'border-white/10 hover:border-[#D4A853]/30 bg-white/[0.02]'
                            }`}>
                              <p className="font-bold text-xs uppercase text-white/80">{car.model}</p>
                              <p className="text-[10px] font-medium text-white/30 mt-1">{car.plate}</p>
                              {alreadyUsed && <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-1.5">Déjà assigné</p>}
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Adhésion club</p>
                        <div className="grid grid-cols-3 gap-2">
                          {([0, 100, 200] as const).map(val => (
                            <button key={val} onClick={() => setAdhesionAmount(val)} className={`py-3 rounded-xl text-xs font-bold uppercase tracking-tight border transition-all ${adhesionAmount === val ? 'gold-gradient text-[#0A0A0A] border-[#D4A853]' : 'bg-white/5 text-white/50 border-white/10 hover:border-[#D4A853]/30 hover:text-white/70'}`}>
                              {val === 0 ? 'Gratuite' : `${val} €`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Mensuel HT</p>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={mensuelAmount}
                              onChange={e => setMensuelAmount(parseFloat(e.target.value) || 0)} step={10}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-white outline-none focus:border-[#D4A853]/50 text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">€</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Caution HT</p>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={cautionAmount}
                              onChange={e => setCautionAmount(parseFloat(e.target.value) || 0)} step={10}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-white outline-none focus:border-[#D4A853]/50 text-right"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">€</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Début</p>
                          <input type="date" value={assignStartDate} onChange={e => setAssignStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-[#D4A853]/50 outline-none" />
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Fin (Optionnel)</p>
                          <input type="date" value={assignEndDate} onChange={e => setAssignEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-[#D4A853]/50 outline-none" />
                        </div>
                      </div>

                      <button onClick={handleAssign} disabled={!selectedCar} className="w-full gold-gradient text-[#0A0A0A] py-5 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-900/20 transition-all">
                        Valider l'accès
                      </button>
                    </div>
                  )}
                  <button onClick={() => resetSelection()} className="w-full text-[10px] font-semibold text-white/20 uppercase tracking-widest mt-2 hover:text-white/50 transition-colors">Annuler</button>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SHEET MOBILE — s'affiche quand une place est sélectionnée */}
          {selectedSlot && (
            <div className="lg:hidden fixed inset-0 z-[90] flex items-end" onClick={(e) => { if (e.target === e.currentTarget) resetSelection(); }}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-[2rem] border-t border-[#D4A853]/15 p-6 animate-fade-in-up" style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #111 100%)', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                {selectedSlot.status === 'occupé' ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Emplacement occupé</p>
                      <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Place #{selectedSlot.number}</h2>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                      <p className="text-xs font-bold text-white/70 uppercase">{selectedSlot.prenom} {selectedSlot.nom}</p>
                      <p className="text-[10px] text-[#D4A853]/60 italic">{selectedSlot.carModel} — {selectedSlot.licensePlate}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">Depuis le {selectedSlot.startDate}</p>
                      <div className="pt-3 mt-3 border-t border-white/10">
                        <p className="text-[9px] text-[#D4A853]/50 uppercase tracking-widest mb-2">Date de fin prévue</p>
                        <input type="date" defaultValue={selectedSlot.endDate || ''} onChange={e => handleUpdateEndDate(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-[#D4A853]/30" />
                      </div>
                    </div>
                    <button onClick={() => setShowConfirmModal(selectedSlot.number)} className="w-full bg-rose-500/10 text-rose-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                      Révoquer l'accès
                    </button>
                    <button onClick={() => resetSelection()} className="w-full text-[10px] font-semibold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors">Fermer</button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-[0.2em] mb-2">Attribution</p>
                      <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Place #{selectedSlot.number}</h2>
                    </div>
                    {!selectedUser ? (
                      <div className="relative">
                        <Search className="absolute left-4 top-4 text-[#D4A853]/30" size={18}/>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 outline-none transition-all" placeholder="Rechercher un client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                        {searchTerm && (
                          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[#D4A853]/15 p-2 z-50 max-h-40 overflow-y-auto" style={{ background: '#1A1A1A', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                              <div key={u._id} onClick={() => { setSelectedUser(u); setSearchTerm(''); }} className="p-3 hover:bg-[#D4A853]/10 cursor-pointer rounded-xl font-bold text-xs uppercase text-white/70 hover:text-[#D4A853] transition-colors border-b border-white/5 last:border-none">
                                {u.nom} {u.prenom}
                                <span className="block text-[9px] text-white/30 font-normal normal-case mt-0.5">{u.email}</span>
                              </div>
                            )) : (
                              <p className="p-3 text-[10px] text-white/30 text-center">Aucun résultat</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="gold-gradient text-[#0A0A0A] p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-black uppercase text-xs">{selectedUser.nom} {selectedUser.prenom}</p>
                            <p className="text-[9px] font-medium opacity-60 mt-0.5">{selectedUser.email}</p>
                          </div>
                          <button onClick={() => { setSelectedUser(null); setSelectedCar(null); }} className="opacity-60 hover:opacity-100"><X size={16}/></button>
                        </div>
                        <p className="text-[10px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] ml-1">Sélectionner le véhicule</p>
                        <div className="grid gap-2">
                          {selectedUser.cars.map((car: any, idx: number) => {
                            const alreadyUsed = isCarAlreadyAssigned(car);
                            return (
                              <button key={idx} onClick={() => !alreadyUsed && setSelectedCar({ ...car, _idx: idx })} disabled={alreadyUsed} className={`p-3 rounded-xl border text-left transition-all ${
                                alreadyUsed ? 'opacity-30 cursor-not-allowed border-rose-500/20' : selectedCar?._idx === idx ? 'border-[#D4A853]/40 bg-[#D4A853]/10' : 'border-white/10 bg-white/[0.02]'
                              }`}>
                                <p className="font-bold text-xs uppercase text-white/80">{car.model}</p>
                                <p className="text-[10px] font-medium text-white/30 mt-0.5">{car.plate}</p>
                                {alreadyUsed && <p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Déjà assigné</p>}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mb-4">
                          <p className="text-[8px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Adhésion club</p>
                          <div className="grid grid-cols-3 gap-2">
                            {([0, 100, 200] as const).map(val => (
                              <button key={val} onClick={() => setAdhesionAmount(val)} className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-tight border transition-all ${adhesionAmount === val ? 'gold-gradient text-[#0A0A0A] border-[#D4A853]' : 'bg-white/5 text-white/50 border-white/10 hover:border-[#D4A853]/30'}`}>
                                {val === 0 ? 'Gratuite' : `${val} €`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[8px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Mensuel HT</p>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={mensuelAmount}
                                onChange={e => setMensuelAmount(parseFloat(e.target.value) || 0)} step={10}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-white outline-none focus:border-[#D4A853]/50 text-right"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">€</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-2">Caution HT</p>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={cautionAmount}
                                onChange={e => setCautionAmount(parseFloat(e.target.value) || 0)} step={10}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-7 text-xs font-bold text-white outline-none focus:border-[#D4A853]/50 text-right"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">€</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[8px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-1">Début</p>
                            <input type="date" value={assignStartDate} onChange={e => setAssignStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" />
                          </div>
                          <div>
                            <p className="text-[8px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.2em] mb-1">Fin</p>
                            <input type="date" value={assignEndDate} onChange={e => setAssignEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" />
                          </div>
                        </div>
                        <button onClick={handleAssign} disabled={!selectedCar} className="w-full gold-gradient text-[#0A0A0A] py-4 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                          Valider l'accès
                        </button>
                      </div>
                    )}
                    <button onClick={() => resetSelection()} className="w-full text-[10px] font-semibold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors">Fermer</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        ) : activeTab === 'invoices' ? (
        /* SECTION FACTURES */
        <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Toutes les <span className="text-[#D4A853]">Factures</span></h2>
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">Recherche et filtrage multicritères</p>
              </div>
            </div>

            {/* FILTRES FACTURES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filtre Nom */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4A853]/40" size={14} />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom..." 
                  value={invoiceFilterName}
                  onChange={(e) => setInvoiceFilterName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/30 outline-none transition-all"
                />
              </div>

              {/* Filtre Voiture */}
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4A853]/40" size={14} />
                <input 
                  type="text" 
                  placeholder="Modèle ou plaque..." 
                  value={invoiceFilterCar}
                  onChange={(e) => setInvoiceFilterCar(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-xs text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/30 outline-none transition-all"
                />
              </div>

              {/* Filtre Période */}
              <div className="relative flex">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4A853]/40" size={14} />
                <select 
                  value={invoiceFilterMonth}
                  onChange={(e) => setInvoiceFilterMonth(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 pr-8 text-xs text-white outline-none focus:ring-2 focus:ring-[#D4A853]/30 transition-all appearance-none"
                >
                  <option value="all">Toutes les périodes</option>
                  {Array.from(new Set(invoices.map(inv => {
                    const d = new Date(inv.periodStart);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  }))).sort((a, b) => b.localeCompare(a)).map(m => {
                    const [year, month] = m.split('-');
                    const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
          
          {(() => {
            // Application des 3 filtres indépendants
            const filteredInvoices = invoices.filter(inv => {
              const matchName = !invoiceFilterName || 
                (inv.clientNom?.toLowerCase() || '').includes(invoiceFilterName.toLowerCase()) || 
                (inv.clientPrenom?.toLowerCase() || '').includes(invoiceFilterName.toLowerCase());
              
              const matchCar = !invoiceFilterCar || 
                (inv.carModel?.toLowerCase() || '').includes(invoiceFilterCar.toLowerCase()) ||
                (inv.licensePlate?.toLowerCase() || '').includes(invoiceFilterCar.toLowerCase());
              
              const matchMonth = invoiceFilterMonth === 'all' || (() => {
                const d = new Date(inv.periodStart);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === invoiceFilterMonth;
              })();

              return matchName && matchCar && matchMonth;
            });

            return filteredInvoices.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredInvoices.map((inv: any) => (
                  <div key={inv._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 bg-[#D4A853]/10 rounded-xl flex items-center justify-center text-[#D4A853] border border-[#D4A853]/15">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-tight">{inv.invoiceNumber}</p>
                        <p className="text-[10px] font-medium text-white/40 mt-0.5">{inv.clientPrenom} {inv.clientNom} — Place #{inv.slotNumber}</p>
                        <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest mt-0.5">
                          {formatDateFR(inv.periodStart)} → {formatDateFR(inv.periodEnd)} · {inv.type === 'prorata' ? 'Prorata' : 'Mensuel'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:ml-0 ml-15">
                      <div className="text-right">
                        <p className="text-sm font-black text-[#D4A853]">{(inv.amount * 1.20).toFixed(2)} €</p>
                        <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">TTC</p>
                        <p className="text-[8px] text-white/30 uppercase tracking-wider">({inv.amount.toFixed(2)} € HT)</p>
                      </div>
                      <button
                        onClick={() => { const u = users.find((u: any) => u.email === inv.clientEmail); generateInvoicePDF({ ...inv, mandat: u?.mandat, immeuble: u?.immeuble }); }}
                        title="Télécharger PDF"
                        className="h-9 w-9 bg-white/5 text-[#D4A853] rounded-lg flex items-center justify-center hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-white/10 hover:border-[#D4A853] cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleExportInvoiceCSV(inv)}
                        title="Télécharger CSV"
                        className="h-9 px-2.5 bg-white/5 text-white/40 rounded-lg flex items-center justify-center gap-1 hover:bg-white/10 hover:text-white/70 transition-all border border-white/10 cursor-pointer text-[9px] font-bold uppercase tracking-tight"
                      >
                        CSV
                      </button>
                      {inv.isFirstMonth && (
                        <button
                          onClick={() => handleSecondMonthPDF(inv)}
                          title="Générer la facture du 2ème mois (240 € HT)"
                          className="h-9 px-2.5 bg-white/5 text-blue-400 rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-500/20 hover:text-blue-300 transition-all border border-white/10 hover:border-blue-500/40 cursor-pointer text-[9px] font-bold uppercase tracking-tight whitespace-nowrap"
                        >
                          <CalendarIcon size={12} />
                          Mois 2
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                        title="Supprimer la facture"
                        className="h-9 w-9 bg-white/5 text-red-400/70 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 hover:border-red-500/30 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-white/15">
                <Filter size={32} className="mx-auto mb-4 opacity-50" />
                <p className="font-semibold uppercase text-[10px] tracking-[0.2em]">Aucune facture ne correspond aux filtres</p>
                {(invoiceFilterName || invoiceFilterCar || invoiceFilterMonth !== 'all') && (
                  <button 
                    onClick={() => { setInvoiceFilterName(''); setInvoiceFilterCar(''); setInvoiceFilterMonth('all'); }}
                    className="mt-4 text-[#D4A853] text-[10px] font-bold uppercase tracking-widest hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            );
          })()}
        </div>
        ) : activeTab === 'recap' ? (
        /* SECTION RÉCAP ANNUEL */
        (() => {
          const OWNER_SLOT = 30;

          // Extraire les mois uniques des factures (format YYYY-MM), triés chrono
          const monthKeys = Array.from(new Set(
            invoices.map(inv => inv.periodStart.slice(0, 7))
          )).sort();

          // Libellé français pour chaque mois
          const monthLabel = (key: string) => {
            const [y, m] = key.split('-').map(Number);
            return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          };

          // Par slot : index des factures
          const invBySlot: Record<number, any[]> = {};
          invoices.forEach(inv => {
            if (!invBySlot[inv.slotNumber]) invBySlot[inv.slotNumber] = [];
            invBySlot[inv.slotNumber].push(inv);
          });

          // Montant mensuel d'une facture (hors adhésion)
          const mensuelNet = (inv: any) => {
            if (inv.isFirstMonth) return parseFloat((inv.amount - (inv.adhesionAmount ?? 200)).toFixed(2));
            return inv.amount as number;
          };

          // Totaux par place et par mois (hors adhésion, propriétaire = 0)
          const grandTotalHT = slots.reduce((sum, slot) => {
            if (slot.number === OWNER_SLOT) return sum;
            return sum + (invBySlot[slot.number] || []).reduce((s: number, inv: any) => s + mensuelNet(inv), 0);
          }, 0);
          const grandTVA = grandTotalHT * 0.20;
          const grandTTC = grandTotalHT + grandTVA;
          const colSpanTotal = 5 + monthKeys.length;

          return (
            <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Récap <span className="text-[#D4A853]">des Factures</span></h2>
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">{monthKeys.length} mois · {slots.filter(s => s.status === 'occupé').length} place(s) occupée(s)</p>
                </div>
                <button
                  onClick={handleExportRecapExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4A853]/20 hover:border-[#D4A853]/60 transition-all whitespace-nowrap"
                >
                  <Download size={13} />
                  Télécharger Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse" style={{ minWidth: `${Math.max(900, 500 + monthKeys.length * 90)}px` }}>
                  <thead>
                    <tr className="bg-[#0F0F0F]">
                      <th className="sticky left-0 z-10 bg-[#0F0F0F] text-left px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">N°</th>
                      <th className="text-left px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Nom</th>
                      <th className="text-left px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Prénom</th>
                      <th className="text-left px-4 py-3 text-white/40 font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">N° Bip</th>
                      <th className="text-right px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Adhésion HT</th>
                      {monthKeys.map(key => (
                        <th key={key} className="text-right px-3 py-3 text-white/40 font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap capitalize">{monthLabel(key)}</th>
                      ))}
                      <th className="text-right px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Total HT</th>
                      <th className="text-right px-4 py-3 text-white/40 font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">TVA (20%)</th>
                      <th className="text-right px-4 py-3 text-[#D4A853] font-bold uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Total TTC</th>
                      <th className="px-2 py-3 border-b border-white/5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      type RecapRow = {
                        key: string;
                        slotNumber: number;
                        isOwner: boolean;
                        clientNom: string | null;
                        clientPrenom: string | null;
                        clientEmail: string;
                        adhesion: number | null;
                        hasLeft: boolean;
                        invs: any[];
                      };
                      const rows: RecapRow[] = [];

                      slots.forEach(slot => {
                        const isOwner = slot.number === OWNER_SLOT;
                        const slotInvs = invBySlot[slot.number] || [];

                        if (isOwner) {
                          rows.push({ key: `slot-${slot.number}`, slotNumber: slot.number, isOwner: true, clientNom: slot.nom, clientPrenom: slot.prenom, clientEmail: '', adhesion: null, hasLeft: false, invs: [] });
                          return;
                        }

                        if (slotInvs.length === 0) {
                          rows.push({ key: `slot-${slot.number}-empty`, slotNumber: slot.number, isOwner: false, clientNom: slot.status === 'occupé' ? slot.nom : null, clientPrenom: slot.status === 'occupé' ? slot.prenom : null, clientEmail: '', adhesion: null, hasLeft: false, invs: [] });
                          return;
                        }

                        const byClient: Record<string, any[]> = {};
                        slotInvs.forEach((inv: any) => {
                          if (!byClient[inv.clientEmail]) byClient[inv.clientEmail] = [];
                          byClient[inv.clientEmail].push(inv);
                        });

                        Object.entries(byClient).forEach(([email, clientInvs]) => {
                          const ref = clientInvs[0];
                          const firstInv = clientInvs.find((i: any) => i.isFirstMonth);
                          const hasLeft = slot.status !== 'occupé' || slot.email !== email;
                          rows.push({
                            key: `slot-${slot.number}-${email}`,
                            slotNumber: slot.number,
                            isOwner: false,
                            clientNom: ref.clientNom,
                            clientPrenom: ref.clientPrenom,
                            clientEmail: email,
                            adhesion: firstInv?.adhesionAmount ?? null,
                            hasLeft,
                            invs: clientInvs,
                          });
                        });
                      });

                      // Helper BIP : cherche le N° bip du véhicule correspondant à la facture
                      const getCarBip = (clientEmail: string, carModel?: string): string => {
                        const u = users.find((usr: any) => usr.email === clientEmail);
                        if (!u?.cars?.length) return '';
                        if (carModel) {
                          const car = u.cars.find((c: any) => c.model === carModel);
                          if (car?.bipNumber) return car.bipNumber;
                        }
                        return u.cars[0]?.bipNumber ?? '';
                      };

                      // Helper : input inline générique
                      const CellInput = ({ value, onChange, onSave, onCancel, width = 'w-20', autoFocus = false }: {
                        value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; width?: string; autoFocus?: boolean;
                      }) => (
                        <input
                          autoFocus={autoFocus}
                          value={value}
                          onChange={e => onChange(e.target.value)}
                          onBlur={onSave}
                          onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
                          className={`${width} bg-[#D4A853]/10 border border-[#D4A853]/50 rounded px-1.5 py-0.5 text-white/90 text-[10px] outline-none focus:border-[#D4A853] text-right`}
                        />
                      );

                      const startEdit = (rowKey: string, field: string, value: string, row: RecapRow, inv?: any) => {
                        setEditingCell({ rowKey, field, slotNumber: row.slotNumber, clientEmail: row.clientEmail, clientNom: row.clientNom, clientPrenom: row.clientPrenom, inv });
                        setEditCellValue(value);
                      };

                      return rows.map((row, idx) => {
                        const bg = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : '#0A0A0A';
                        const rowTotalHT = row.isOwner ? 0 : row.invs.reduce((s: number, inv: any) => s + mensuelNet(inv), 0);
                        const rowTVA = parseFloat((rowTotalHT * 0.20).toFixed(2));
                        const rowTTC = parseFloat((rowTotalHT * 1.20).toFixed(2));
                        const isEditableRow = !row.isOwner && row.invs.length > 0;
                        const ec = editingCell;

                        return (
                          <tr key={row.key} className="border-b border-white/[0.03] hover:bg-[#D4A853]/[0.03] transition-colors group">
                            <td className="sticky left-0 z-10 px-4 py-2.5 font-black text-white/70 whitespace-nowrap" style={{ background: bg }}>
                              #{row.slotNumber}
                            </td>

                            {/* NOM */}
                            <td className="px-2 py-1.5 font-semibold whitespace-nowrap" style={{ background: bg }}>
                              {row.isOwner
                                ? <span className="text-[#D4A853]/60">{row.clientNom} (proprio)</span>
                                : isEditableRow && ec?.rowKey === row.key && ec.field === 'nom'
                                  ? <CellInput autoFocus value={editCellValue} onChange={setEditCellValue} onSave={handleSaveCell} onCancel={() => setEditingCell(null)} width="w-24" />
                                  : row.clientNom
                                    ? <span className={`text-white/60 ${isEditableRow ? 'cursor-pointer hover:text-white/90 hover:underline decoration-dotted decoration-[#D4A853]/40' : ''}`} onClick={() => isEditableRow && startEdit(row.key, 'nom', row.clientNom ?? '', row)}>{row.clientNom}{row.hasLeft ? <span className="ml-1.5 text-[8px] text-white/25 uppercase tracking-wider font-normal">(parti)</span> : ''}</span>
                                    : <span className="text-white/15 italic">Disponible</span>}
                            </td>

                            {/* PRÉNOM */}
                            <td className="px-2 py-1.5 font-semibold text-white/60 whitespace-nowrap">
                              {isEditableRow && ec?.rowKey === row.key && ec.field === 'prenom'
                                ? <CellInput autoFocus value={editCellValue} onChange={setEditCellValue} onSave={handleSaveCell} onCancel={() => setEditingCell(null)} width="w-20" />
                                : <span className={`${isEditableRow ? 'cursor-pointer hover:text-white/90 hover:underline decoration-dotted decoration-[#D4A853]/40' : ''}`} onClick={() => isEditableRow && startEdit(row.key, 'prenom', row.clientPrenom ?? '', row)}>{row.clientPrenom ?? ''}</span>}
                            </td>

                            {/* BIP */}
                            <td className="px-4 py-2.5 font-mono text-white/40 whitespace-nowrap text-[10px]">
                              {(() => {
                                const bip = !row.isOwner && row.clientEmail ? getCarBip(row.clientEmail, row.invs[0]?.carModel) : '';
                                return bip ? <span>{bip}</span> : <span className="text-white/10">—</span>;
                              })()}
                            </td>

                            {/* ADHÉSION */}
                            <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                              {row.isOwner
                                ? <span className="text-white/20">—</span>
                                : (() => {
                                    const firstInv = row.invs.find((i: any) => i.isFirstMonth);
                                    if (!firstInv) return <span className="text-white/10">—</span>;
                                    return ec?.rowKey === row.key && ec.field === 'adhesion'
                                      ? <CellInput autoFocus value={editCellValue} onChange={setEditCellValue} onSave={handleSaveCell} onCancel={() => setEditingCell(null)} width="w-16" />
                                      : <span className="text-[#D4A853]/80 cursor-pointer hover:text-[#D4A853] hover:underline decoration-dotted" onClick={() => startEdit(row.key, 'adhesion', String(firstInv.adhesionAmount ?? 200), row, firstInv)}>{(firstInv.adhesionAmount ?? 200).toFixed(2)} €</span>;
                                  })()}
                            </td>

                            {/* MOIS */}
                            {monthKeys.map(key => {
                              const inv = row.invs.find((i: any) => i.periodStart.slice(0, 7) === key);
                              const amt = row.isOwner ? null : (inv ? mensuelNet(inv) : null);
                              const isCellEditing = ec?.rowKey === row.key && ec.field === key;
                              return (
                                <td key={key} className="px-2 py-1.5 text-right whitespace-nowrap">
                                  {isCellEditing
                                    ? <CellInput autoFocus value={editCellValue} onChange={setEditCellValue} onSave={handleSaveCell} onCancel={() => setEditingCell(null)} width="w-16" />
                                    : amt !== null
                                      ? <span className="text-white/55 cursor-pointer hover:text-white/90 hover:underline decoration-dotted decoration-[#D4A853]/40" onClick={() => startEdit(row.key, key, String(amt), row, inv)}>{(amt as number).toFixed(2)} €</span>
                                      : <span className="text-white/10">—</span>}
                                </td>
                              );
                            })}

                            {/* TOTAUX */}
                            <td className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                              {row.isOwner ? <span className="text-white/20">—</span> : rowTotalHT > 0 ? <span className="text-white/70">{rowTotalHT.toFixed(2)} €</span> : <span className="text-white/10">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                              {row.isOwner ? <span className="text-white/20">—</span> : rowTVA > 0 ? <span className="text-white/40">{rowTVA.toFixed(2)} €</span> : <span className="text-white/10">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                              {row.isOwner ? <span className="text-white/20">0,00 €</span> : rowTTC > 0 ? <span className="text-emerald-400/80">{rowTTC.toFixed(2)} €</span> : <span className="text-white/10">—</span>}
                            </td>

                            {/* SUPPRIMER LIGNE */}
                            <td className="px-2 py-1.5 text-center whitespace-nowrap">
                              {isEditableRow && (
                                <button
                                  onClick={() => handleDeleteRecapRow(row.slotNumber, row.clientEmail, row.clientNom ?? '', row.clientPrenom ?? '')}
                                  title="Supprimer toutes les factures de ce client pour cette place"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-400/70 rounded flex items-center justify-center hover:bg-red-500/30 hover:text-red-400 transition-all"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={colSpanTotal + 4} className="py-1 border-t border-[#D4A853]/20" /></tr>
                    <tr className="bg-white/[0.02]">
                      <td colSpan={5} className="sticky left-0 z-10 px-4 py-3 font-black text-white/50 uppercase tracking-widest text-[9px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        Totaux <span className="text-white/20 font-normal normal-case">(hors adhésion)</span>
                      </td>
                      {monthKeys.map(key => {
                        const monthTotal = invoices
                          .filter((inv: any) => inv.periodStart.slice(0, 7) === key && inv.slotNumber !== OWNER_SLOT)
                          .reduce((s: number, inv: any) => s + mensuelNet(inv), 0);
                        return <td key={key} className="px-3 py-3 text-right font-bold text-white/40 whitespace-nowrap">{monthTotal.toFixed(2)} €</td>;
                      })}
                      <td className="px-4 py-3 text-right font-black text-white whitespace-nowrap">{grandTotalHT.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right font-bold text-white/50 whitespace-nowrap">{grandTVA.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right font-black text-[#D4A853] text-sm whitespace-nowrap">{grandTTC.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()
        ) : activeTab === 'clients' ? (
        /* SECTION CLIENTS */
        <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* En-tête */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Gestion des <span className="text-[#D4A853]">Clients</span></h2>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">{users.filter((u: any) => u.role !== 'admin').length} client(s) enregistré(s)</p>
            </div>
            <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-[#D4A853]/30 hover:bg-[#D4A853]/10 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
            >
              <UserPlus size={13} />Ajouter un client
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A853]/40" size={14} />
              <input
                type="text"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#D4A853]/30"
              />
            </div>
            </div>
          </div>

          {/* Liste clients */}
          <div className="divide-y divide-white/[0.04]">
            {users
              .filter((u: any) => u.role !== 'admin')
              .filter((u: any) => {
                const q = clientSearch.toLowerCase();
                return !q || u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
              })
              .map((u: any) => {
                const assignedSlot = slots.find(s => s.email === u.email && s.status === 'occupé');
                const userInvoices = invoices.filter((inv: any) => inv.clientEmail === u.email);
                const totalFacturé = userInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
                const initials = `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
                const memberSince = u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

                return (
                  <div key={u._id} className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Avatar + identité */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border border-[#D4A853]/20" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.05))' }}>
                          <span className="text-[#D4A853]">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-white/90">{u.prenom} {u.nom}</p>
                            {assignedSlot && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                                Place #{assignedSlot.number}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Mail size={10} className="text-white/20 shrink-0" />
                            <p className="text-[11px] text-white/40 truncate">{u.email}</p>
                          </div>
                          {memberSince && (
                            <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1">Membre depuis le {memberSince}</p>
                          )}
                        </div>
                      </div>

                      {/* Véhicules */}
                      <div className="sm:w-56 shrink-0">
                        <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-2">
                          <Car size={9} className="inline mr-1 -mt-0.5" />Véhicule(s)
                        </p>
                        {u.cars && u.cars.length > 0 ? (
                          <div className="space-y-1.5">
                            {u.cars.map((car: any, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-white/60">{car.model}</span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-white/5 text-white/30 border border-white/10">{car.plate}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-white/15 italic">Aucun véhicule</p>
                        )}
                      </div>

                      {/* Stats factures */}
                      <div className="sm:w-44 shrink-0">
                        <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-2">
                          <CreditCard size={9} className="inline mr-1 -mt-0.5" />Facturation
                        </p>
                        <p className="text-sm font-black text-[#D4A853]">{(totalFacturé * 1.20).toFixed(2)} €</p>
                        <p className="text-[9px] text-white/20 mt-0.5">TTC ({totalFacturé.toFixed(2)} € HT)</p>
                        <p className="text-[9px] text-white/30 mt-1">{userInvoices.length} facture(s)</p>
                      </div>

                      {/* Slot détail (si assigné) */}
                      {assignedSlot && (
                        <div className="sm:w-44 shrink-0">
                          <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-2">
                            <ParkingCircle size={9} className="inline mr-1 -mt-0.5" />Emplacement
                          </p>
                          <p className="text-[11px] font-bold text-white/70">Place #{assignedSlot.number}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{assignedSlot.carModel}</p>
                          <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-wider">{assignedSlot.licensePlate}</p>
                          <p className="text-[9px] text-white/20 mt-1">Depuis le {assignedSlot.startDate}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditClient(u)}
                          title="Modifier le client"
                          className="h-9 w-9 bg-white/5 text-[#D4A853]/60 rounded-xl flex items-center justify-center hover:bg-[#D4A853]/20 hover:text-[#D4A853] transition-all border border-white/10 hover:border-[#D4A853]/30 cursor-pointer"
                        >
                          <UserCircle size={14} />
                        </button>
                        <button
                          onClick={() => setExpandedClientId(expandedClientId === u._id ? null : u._id)}
                          title="Voir les factures"
                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${expandedClientId === u._id ? 'bg-[#D4A853]/20 text-[#D4A853] border-[#D4A853]/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70'}`}
                        >
                          <Receipt size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id, u.nom, u.prenom)}
                          title="Supprimer le client"
                          className="h-9 w-9 bg-white/5 text-red-400/60 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 hover:border-red-500/30 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Factures dépliables */}
                    {expandedClientId === u._id && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest">
                            <Receipt size={9} className="inline mr-1 -mt-0.5" />
                            {userInvoices.length} facture(s)
                          </p>
                          <ChevronDown size={12} className="text-white/20 rotate-180" />
                        </div>
                        {userInvoices.length === 0 ? (
                          <p className="text-[10px] text-white/15 italic">Aucune facture</p>
                        ) : (
                          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {[...userInvoices]
                              .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                              .map((inv: any) => (
                                <div key={inv._id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold text-white/70 font-mono">{inv.invoiceNumber}</span>
                                      {inv.carModel && (
                                        <span className="text-[9px] text-white/30 truncate">{inv.carModel}</span>
                                      )}
                                      {inv.isFirstMonth && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#D4A853]/10 text-[#D4A853]/60 border border-[#D4A853]/20">1er mois</span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-white/25 mt-0.5">
                                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('fr-FR') : '—'}
                                      {' · '}
                                      <span className="text-[#D4A853]/60 font-semibold">{(inv.amount * 1.20).toFixed(2)} € TTC</span>
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => generateInvoicePDF({ ...inv, mandat: u.mandat, immeuble: u.immeuble })}
                                    title="Télécharger le PDF"
                                    className="h-7 w-7 shrink-0 bg-white/5 text-white/30 rounded-lg flex items-center justify-center hover:bg-[#D4A853]/20 hover:text-[#D4A853] transition-all border border-white/10"
                                  >
                                    <Download size={11} />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            {users.filter((u: any) => u.role !== 'admin').filter((u: any) => {
              const q = clientSearch.toLowerCase();
              return !q || u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
            }).length === 0 && (
              <div className="p-16 text-center text-white/15">
                <UserCircle size={32} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold uppercase text-[10px] tracking-[0.2em]">Aucun client trouvé</p>
              </div>
            )}
          </div>
        </div>
        ) : (
        /* SECTION MESSAGERIE ADMIN */
        <div className="rounded-[2rem] border border-white/5 overflow-hidden flex flex-col min-h-[600px]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Centre de <span className="text-[#D4A853]">Messagerie</span></h2>
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">{messages.filter(m => m.status === 'nouveau').length} message(s) en attente de traitement</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMessageFilterStatus('all')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${messageFilterStatus === 'all' ? 'bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}>Tous</button>
                <button onClick={() => setMessageFilterStatus('nouveau')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${messageFilterStatus === 'nouveau' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}>Nouveau</button>
                <button onClick={() => setMessageFilterStatus('traité')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${messageFilterStatus === 'traité' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}>Traité</button>
                <button onClick={() => setMessageFilterStatus('clôturé')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${messageFilterStatus === 'clôturé' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}>Clôturé</button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Liste des tickets */}
            <div className={`md:w-1/3 border-r border-white/5 overflow-y-auto no-scrollbar bg-black/20 flex flex-col ${expandedMessageId ? 'hidden md:flex' : 'flex'}`}>
              {messages.filter(m => messageFilterStatus === 'all' || m.status === messageFilterStatus).length > 0 ? (
                <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
                  {messages.filter(m => messageFilterStatus === 'all' || m.status === messageFilterStatus).map((msg: any) => (
                    <div 
                      key={msg._id} 
                      onClick={() => setExpandedMessageId(msg._id)}
                      className={`p-5 cursor-pointer transition-colors border-l-2 ${
                        expandedMessageId === msg._id 
                          ? 'bg-white/[0.04] border-[#D4A853]' 
                          : msg.status === 'nouveau' 
                            ? 'bg-[#D4A853]/[0.02] border-amber-500/50 hover:bg-white/[0.02]' 
                            : 'border-transparent hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{msg.userPrenom} {msg.userNom}</span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          msg.status === 'nouveau' ? 'bg-amber-500 animate-pulse' : 
                          msg.status === 'traité' ? 'bg-emerald-400' : 
                          'bg-white/20'
                        }`} />
                      </div>
                      <h4 className={`text-sm mb-1 truncate ${expandedMessageId === msg._id ? 'font-black text-[#D4A853]' : 'font-bold text-white/80'}`}>{msg.subject}</h4>
                      <p className="text-[10px] text-white/40 truncate">{msg.initialMessage}</p>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest mt-2">{formatDateFR(msg.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-white/15">
                  <p className="font-semibold uppercase text-[10px] tracking-[0.2em]">Aucun ticket</p>
                </div>
              )}
            </div>

            {/* Détail du ticket & Fil de discussion */}
            <div className={`flex-1 flex flex-col bg-[#0A0A0A]/50 relative h-[500px] md:h-auto ${expandedMessageId ? 'flex' : 'hidden md:flex'}`}>
              {expandedMessageId && messages.find(m => m._id === expandedMessageId) ? (() => {
                const msg = messages.find(m => m._id === expandedMessageId);
                return (
                  <>
                    {/* En-tête mobile */}
                    <div className="md:hidden p-4 border-b border-white/5 flex items-center bg-white/[0.02]">
                      <button onClick={() => setExpandedMessageId(null)} className="flex items-center text-[#D4A853] text-[10px] font-bold uppercase tracking-widest">
                        <span className="mr-2">← Retour aux tickets</span>
                      </button>
                    </div>

                    {/* Header Détail */}
                    <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-lg font-black text-[#D4A853] mb-1">{msg.subject}</h3>
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                          Ticket de : <span className="text-white/80">{msg.userPrenom} {msg.userNom}</span> ({msg.userEmail})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={msg.status} 
                          onChange={(e) => handleUpdateMessageStatus(msg._id, e.target.value)}
                          disabled={msg.status === 'clôturé'}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none border appearance-none ${
                            msg.status === 'clôturé' ? 'cursor-not-allowed opacity-70 ' : 'cursor-pointer '
                          } ${
                            msg.status === 'nouveau' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                            msg.status === 'traité' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            'bg-white/10 text-white/60 border-white/20'
                          }`}
                        >
                          <option value="nouveau">Statut: Nouveau</option>
                          <option value="traité">Statut: Traité</option>
                          <option value="clôturé">Statut: Clôturé</option>
                        </select>
                        <button 
                          onClick={() => { handleDeleteMessage(msg._id); setExpandedMessageId(null); }}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                          title="Supprimer le ticket"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Zone des messages (scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                      {/* Message initial (User) */}
                      <div className="flex gap-4 max-w-[85%] self-start">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/50 shrink-0 mt-1">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{msg.userPrenom}</span>
                            <span className="text-[8px] text-white/30">{new Date(msg.createdAt).toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="bg-white/[0.05] border border-white/10 p-4 rounded-2xl rounded-tl-sm text-sm text-white/80 leading-relaxed shadow-sm">
                            {msg.initialMessage || msg.content} {/* Fallback old schema */}
                          </div>
                        </div>
                      </div>

                      {/* Fallback old schema adminReply */}
                      {msg.adminReply && (!msg.replies || msg.replies.length === 0) && (
                        <div className="flex gap-4 max-w-[85%] self-end flex-row-reverse">
                          <div className="w-8 h-8 rounded-xl bg-[#D4A853]/20 flex items-center justify-center text-[#D4A853] shrink-0 mt-1">
                            <Shield size={14} />
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                              <span className="text-[8px] text-[#D4A853]/50">{new Date(msg.updatedAt).toLocaleString('fr-FR')}</span>
                              <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest">Support</span>
                            </div>
                            <div className="bg-[#D4A853]/10 border border-[#D4A853]/20 p-4 rounded-2xl rounded-tr-sm text-sm text-[#D4A853]/90 leading-relaxed shadow-sm text-left">
                              {msg.adminReply}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Liste des réponses (nouveau schéma) */}
                      {msg.replies && msg.replies.map((reply: any, idx: number) => (
                        <div key={idx} className={`flex gap-4 max-w-[85%] ${reply.sender === 'admin' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${reply.sender === 'admin' ? 'bg-[#D4A853]/20 text-[#D4A853]' : 'bg-white/10 text-white/50'}`}>
                            {reply.sender === 'admin' ? <Shield size={14} /> : <Users size={14} />}
                          </div>
                          <div className={reply.sender === 'admin' ? 'text-right' : 'text-left'}>
                            <div className={`flex items-center gap-2 mb-1 ${reply.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              {reply.sender === 'admin' ? (
                                <>
                                  <span className="text-[8px] text-[#D4A853]/50">{new Date(reply.createdAt).toLocaleString('fr-FR')}</span>
                                  <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest">Support</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{msg.userPrenom}</span>
                                  <span className="text-[8px] text-white/30">{new Date(reply.createdAt).toLocaleString('fr-FR')}</span>
                                </>
                              )}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm text-left ${
                              reply.sender === 'admin' 
                                ? 'bg-[#D4A853]/10 border border-[#D4A853]/20 rounded-tr-sm text-[#D4A853]/90' 
                                : 'bg-white/[0.05] border border-white/10 rounded-tl-sm text-white/80'
                            }`}>
                              {reply.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Zone de réponse */}
                    {msg.status !== 'clôturé' && (
                      <div className="p-5 border-t border-white/5 bg-black/40 shrink-0">
                        <div className="flex gap-3 relative">
                          <textarea 
                            value={replyContent[msg._id] || ''}
                            onChange={(e) => setReplyContent({...replyContent, [msg._id]: e.target.value})}
                            placeholder="Écrire votre réponse au client..."
                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#D4A853]/40 focus:border-[#D4A853]/30 outline-none resize-none h-[60px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReplyMessage(msg._id);
                              }
                            }}
                          />
                          <button 
                            onClick={() => handleReplyMessage(msg._id)}
                            disabled={!replyContent[msg._id]?.trim() || isReplying === msg._id}
                            className="bg-[#D4A853] text-black w-[60px] rounded-2xl flex items-center justify-center hover:bg-[#e2b865] hover:shadow-lg hover:shadow-[#D4A853]/20 transition-all disabled:opacity-50"
                          >
                            <Send size={20} className={isReplying === msg._id ? "animate-pulse" : ""} />
                          </button>
                        </div>
                        <p className="text-[9px] text-white/30 mt-2 text-center uppercase tracking-widest">Appuyez sur Entrée pour envoyer</p>
                      </div>
                    )}
                    {msg.status === 'clôturé' && (
                      <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0 text-center">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest"><CheckCircle2 size={12} className="inline mr-1 -mt-0.5" /> Ticket clôturé, aucune réponse possible.</p>
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="h-full flex flex-col items-center justify-center text-white/10">
                  <MessageSquare size={48} className="mb-4 opacity-30" />
                  <p className="font-semibold uppercase text-[10px] tracking-[0.3em]">Sélectionnez un ticket pour l'afficher</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>

    {/* MODAL MODIFIER CLIENT */}
    {editingClientUser && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setEditingClientUser(null); }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 p-6 space-y-5" style={{ background: 'linear-gradient(160deg, #1A1A1A, #111)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Modifier <span className="text-[#D4A853]">{editingClientUser.prenom} {editingClientUser.nom}</span>
            </h3>
            <button onClick={() => setEditingClientUser(null)} className="h-8 w-8 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Nom</p>
              <input value={editClientForm.nom} onChange={e => setEditClientForm(f => ({ ...f, nom: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Prénom</p>
              <input value={editClientForm.prenom} onChange={e => setEditClientForm(f => ({ ...f, prenom: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest">Véhicule(s)</p>
              <button
                onClick={() => setEditClientForm({ ...editClientForm, cars: [...editClientForm.cars, { model: '', plate: '', bipNumber: '' }] })}
                className="text-[9px] font-bold text-[#D4A853]/60 uppercase tracking-widest hover:text-[#D4A853] transition-colors"
              >+ Ajouter</button>
            </div>
            {editClientForm.cars.length === 0 && (
              <p className="text-[10px] text-white/15 italic">Aucun véhicule</p>
            )}
            <div className="space-y-2">
              {editClientForm.cars.map((car, i) => (
                <div key={i} className="space-y-1.5 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <input
                      value={car.model}
                      onChange={e => setEditClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, model: e.target.value } : c) }))}
                      placeholder="Modèle (ex: Renault Clio)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15"
                    />
                    <button
                      onClick={() => setEditClientForm({ ...editClientForm, cars: editClientForm.cars.filter((_, j) => j !== i) })}
                      className="h-7 w-7 shrink-0 bg-white/5 text-red-400/50 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10"
                    ><X size={10} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={car.plate}
                      onChange={e => setEditClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, plate: e.target.value.toUpperCase() } : c) }))}
                      placeholder="AA-000-AA"
                      className="w-28 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15 font-mono uppercase"
                    />
                    <input
                      value={car.bipNumber}
                      onChange={e => setEditClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, bipNumber: e.target.value } : c) }))}
                      placeholder="N° Bip"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Mandat (facture)</p>
            <input value={editClientForm.mandat} onChange={e => setEditClientForm(f => ({ ...f, mandat: e.target.value }))} placeholder="SFERE BM SERVICES" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/20" />
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Immeuble (facture)</p>
            <input value={editClientForm.immeuble} onChange={e => setEditClientForm(f => ({ ...f, immeuble: e.target.value }))} placeholder="Immeuble : 41 Rue Corneille - 31100 Toulouse" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/20" />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditingClientUser(null)} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all">
              Annuler
            </button>
            <button onClick={handleSaveClientEdit} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest gold-gradient text-[#0A0A0A] hover:shadow-lg hover:shadow-amber-900/20 transition-all">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL AJOUTER CLIENT */}
    {showAddClientModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowAddClientModal(false); }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(160deg, #1A1A1A, #111)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nouveau <span className="text-[#D4A853]">Client</span>
            </h3>
            <button onClick={() => setShowAddClientModal(false)} className="h-8 w-8 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Nom *</p>
              <input value={addClientForm.nom} onChange={e => setAddClientForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Prénom *</p>
              <input value={addClientForm.prenom} onChange={e => setAddClientForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Jean" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15" />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Email *</p>
            <input type="email" value={addClientForm.email} onChange={e => setAddClientForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15" />
          </div>

          <div>
            <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest mb-1.5">Mot de passe *</p>
            <input type="password" value={addClientForm.password} onChange={e => setAddClientForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-[#D4A853]/50 uppercase tracking-widest">Véhicule(s)</p>
              <button
                onClick={() => setAddClientForm({ ...addClientForm, cars: [...addClientForm.cars, { model: '', plate: '', bipNumber: '' }] })}
                className="text-[9px] font-bold text-[#D4A853]/60 uppercase tracking-widest hover:text-[#D4A853] transition-colors"
              >+ Ajouter</button>
            </div>
            {addClientForm.cars.length === 0 && (
              <p className="text-[10px] text-white/15 italic">Aucun véhicule</p>
            )}
            <div className="space-y-2">
              {addClientForm.cars.map((car, i) => (
                <div key={i} className="space-y-1.5 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <input
                      value={car.model}
                      onChange={e => setAddClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, model: e.target.value } : c) }))}
                      placeholder="Modèle (ex: Renault Clio)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15"
                    />
                    <button
                      onClick={() => setAddClientForm({ ...addClientForm, cars: addClientForm.cars.filter((_, j) => j !== i) })}
                      className="h-7 w-7 shrink-0 bg-white/5 text-red-400/50 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10"
                    ><X size={10} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={car.plate}
                      onChange={e => setAddClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, plate: e.target.value.toUpperCase() } : c) }))}
                      placeholder="AA-000-AA"
                      className="w-28 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15 font-mono uppercase"
                    />
                    <input
                      value={car.bipNumber}
                      onChange={e => setAddClientForm(f => ({ ...f, cars: f.cars.map((c, j) => j === i ? { ...c, bipNumber: e.target.value } : c) }))}
                      placeholder="N° Bip"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4A853]/40 placeholder:text-white/15 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowAddClientModal(false); setAddClientForm({ nom: '', prenom: '', email: '', password: '', cars: [] }); }} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all">
              Annuler
            </button>
            <button onClick={handleAddClient} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest gold-gradient text-[#0A0A0A] hover:shadow-lg hover:shadow-amber-900/20 transition-all">
              Créer le client
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default AdminDashboard;