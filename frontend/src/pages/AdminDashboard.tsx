import React, { useEffect, useState } from 'react';
import { Car, Search, Info, AlertTriangle, X, Shield, Users, ParkingCircle, Receipt, Download } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'parking' | 'invoices'>('parking');

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
        licensePlate: selectedCar.plate
      });
      resetSelection();
      fetchData();
    } catch (err) { alert("Erreur d'attribution"); }
  };

  const resetSelection = () => {
    setSelectedSlot(null); setSelectedUser(null); setSelectedCar(null); setSearchTerm('');
  };

  const filteredUsers = searchTerm.length > 0 ? users.filter(u => u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) { console.error('Erreur factures', error); }
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
        ) : (
        /* SECTION FACTURES */
        <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Toutes les <span className="text-[#D4A853]">Factures</span></h2>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">{invoices.length} facture(s) émise(s)</p>
          </div>
          {invoices.length > 0 ? (
            <div className="divide-y divide-white/5">
              {invoices.map((inv: any) => (
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
                    <p className="text-sm font-black text-[#D4A853]">{inv.amount.toFixed(2)} €</p>
                    <button 
                      onClick={() => generateInvoicePDF(inv)}
                      className="h-9 w-9 bg-white/5 text-[#D4A853] rounded-lg flex items-center justify-center hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-white/10 hover:border-[#D4A853] cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-white/15 font-semibold uppercase text-[10px] tracking-[0.2em]">Aucune facture émise</div>
          )}
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