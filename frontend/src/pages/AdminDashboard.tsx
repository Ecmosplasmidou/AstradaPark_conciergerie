import React, { useEffect, useState } from 'react';
import { Car, Search, Info, AlertTriangle, X, Shield, Users, ParkingCircle, Receipt, Download, MessageSquare, CheckCircle2, Send, Filter, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'parking' | 'invoices' | 'messages'>('parking');
  
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

  const isCarAlreadyAssigned = (plate: string): boolean => {
    return slots.some(s => s.status === 'occupé' && s.licensePlate === plate);
  };

  const handleAssign = async () => {
    if (!selectedSlot || !selectedUser || !selectedCar) return;
    if (isCarAlreadyAssigned(selectedCar.plate)) {
      alert(`Le véhicule ${selectedCar.plate} est déjà assigné à une place. Libérez-la d'abord.`);
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
        adhesionAmount
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
    generateInvoicePDF({
      ...inv,
      invoiceNumber: `${inv.invoiceNumber}-M2`,
      amount: 240,
      periodStart,
      periodEnd,
      isFirstMonth: false,
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #111118 50%, #0F0F0F 100%)' }}>
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
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-[#D4A853]/60" />
              <p className="text-[#D4A853]/60 font-semibold text-[10px] uppercase tracking-[0.3em]">Panneau d'Administration</p>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Gestion des <span className="text-[#D4A853]">Emplacements</span>
            </h1>
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
                          const alreadyUsed = isCarAlreadyAssigned(car.plate);
                          return (
                            <button key={idx} onClick={() => !alreadyUsed && setSelectedCar(car)} disabled={alreadyUsed} className={`p-4 rounded-xl border text-left transition-all ${
                              alreadyUsed 
                                ? 'opacity-30 cursor-not-allowed border-rose-500/20 bg-rose-500/[0.03]' 
                                : selectedCar?.plate === car.plate 
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
                            const alreadyUsed = isCarAlreadyAssigned(car.plate);
                            return (
                              <button key={idx} onClick={() => !alreadyUsed && setSelectedCar(car)} disabled={alreadyUsed} className={`p-3 rounded-xl border text-left transition-all ${
                                alreadyUsed ? 'opacity-30 cursor-not-allowed border-rose-500/20' : selectedCar?.plate === car.plate ? 'border-[#D4A853]/40 bg-[#D4A853]/10' : 'border-white/10 bg-white/[0.02]'
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
                        onClick={() => generateInvoicePDF(inv)}
                        title="Télécharger la facture"
                        className="h-9 w-9 bg-white/5 text-[#D4A853] rounded-lg flex items-center justify-center hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-white/10 hover:border-[#D4A853] cursor-pointer"
                      >
                        <Download size={14} />
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
  );
};

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default AdminDashboard;