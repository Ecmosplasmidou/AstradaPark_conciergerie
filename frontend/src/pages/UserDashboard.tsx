import React, { useEffect, useState } from 'react';
import { Car, Mail, Plus, Trash2, Save, MapPin, Calendar, Receipt, Download, CreditCard } from 'lucide-react';
import api from '../services/api';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';


const UserDashboard = () => {
  const [user, setUser] = useState<any>({ nom: '', prenom: '', email: '', cars: [] });
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState<string>('all');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData) {
      setUser({ ...userData, cars: userData.cars || [] });
    }
    fetchMySlots(userData.email);
    fetchInvoices();
  }, []);

  const fetchMySlots = async (email: string) => {
    try {
      const response = await api.get('/parking');
      const foundSlots = response.data.filter((s: any) => s.email === email);
      setMySlots(foundSlots);
    } catch (e) { console.error(e); }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/my');
      setInvoices(response.data);
    } catch (e) { console.error(e); }
  };

  const handleAddCar = () => {
    setUser({ ...user, cars: [...(user.cars || []), { model: '', plate: '' }] });
  };

  const handleRemoveCar = (index: number) => {
    const newCars = user.cars.filter((_: any, i: number) => i !== index);
    setUser({ ...user, cars: newCars });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/auth/profile', { cars: user.cars });
      localStorage.setItem('user', JSON.stringify(user));
      setMessage('Modifications enregistrées');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de la sauvegarde');
    }
    setIsSaving(false);
  };

  const handleDownloadInvoice = (invoice: any) => {
    generateInvoicePDF(invoice);
  };

  if (!user.email) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 100%)' }}>
      <div className="text-center">
        <div className="gold-shimmer text-xl font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Playfair Display', serif" }}>KELVAL SARL</div>
        <p className="text-[#D4A853]/40 text-xs uppercase tracking-widest mt-2 animate-pulse">Chargement de votre espace...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #111118 50%, #0F0F0F 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
      
        {/* HEADER */}
        <header className="flex justify-between items-center">
          <div>
            <p className="text-[#D4A853]/50 font-semibold text-[10px] uppercase tracking-[0.3em] mb-2">Espace Membre</p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bonjour, <span className="text-[#D4A853]">{user.prenom}</span>
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* COLONNE GAUCHE : PLACES RÉSERVÉES & FACTURES */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION PLACES RÉSERVÉES */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 ml-1">
                <MapPin size={12} className="text-[#D4A853]/50" />
                <h3 className="text-[10px] font-semibold text-[#D4A853]/60 uppercase tracking-[0.3em]">Mes Emplacements ({mySlots.length})</h3>
              </div>
              {mySlots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {mySlots.map((slot) => (
                    <div key={slot.number} className="rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-[#D4A853]/15" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.12) 0%, rgba(212,168,83,0.03) 100%)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                      <MapPin className="absolute -right-4 -top-4 text-[#D4A853]/5 group-hover:scale-110 transition-transform duration-700" size={130} />
                      <div className="relative z-10">
                        <p className="text-[9px] font-semibold text-[#D4A853]/50 uppercase tracking-[0.3em] mb-1">Place de Stationnement</p>
                        <h2 className="text-4xl sm:text-5xl font-black mb-4 sm:mb-5 tracking-tight text-white/90" style={{ fontFamily: "'Playfair Display', serif" }}>#{slot.number}</h2>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            <Car size={14} className="text-[#D4A853]/60" />
                            <span className="font-bold text-[10px] uppercase tracking-tight text-white/70">{slot.carModel}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            <Calendar size={14} className="text-[#D4A853]/60" />
                            <span className="font-bold text-[10px] uppercase tracking-tight text-white/70">
                              {slot.endDate ? `Du ${slot.startDate} au ${slot.endDate}` : `Depuis le ${slot.startDate}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/10 p-12 rounded-[2rem] text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <p className="text-white/20 font-semibold uppercase text-[10px] tracking-[0.2em] leading-relaxed">Aucun emplacement actif<br/>Contactez l'administration</p>
                </div>
              )}
            </section>

            {/* SECTION FACTURATION */}
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 ml-1">
                  <Receipt size={12} className="text-[#D4A853]/50" />
                  <h3 className="text-[10px] font-semibold text-[#D4A853]/60 uppercase tracking-[0.3em]">Mes Factures ({invoices.length})</h3>
                </div>
                {invoices.length > 0 && (() => {
                  const months = Array.from(new Set(invoices.map(inv => {
                    const d = new Date(inv.periodStart);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                  }))).sort((a, b) => b.localeCompare(a));
                  
                  return (
                    <select 
                      value={invoiceFilterMonth} 
                      onChange={e => setInvoiceFilterMonth(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#D4A853]/50 transition-colors"
                    >
                      <option value="all">Tous les mois</option>
                      {months.map(m => {
                        const [year, month] = m.split('-');
                        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                        return <option key={m} value={m}>{monthName}</option>;
                      })}
                    </select>
                  );
                })()}
              </div>
              <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {invoices.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {invoices.filter(inv => {
                      if (invoiceFilterMonth === 'all') return true;
                      const d = new Date(inv.periodStart);
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === invoiceFilterMonth;
                    }).map((inv) => (
                      <div key={inv._id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-[#D4A853]/10 rounded-2xl flex items-center justify-center text-[#D4A853] border border-[#D4A853]/15">
                            <Receipt size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight text-white/70">{inv.invoiceNumber}</p>
                            <p className="text-[10px] font-medium text-white/30 mt-0.5">
                              Place #{inv.slotNumber} — {inv.type === 'prorata' ? 'Prorata' : 'Mensuel'}
                            </p>
                            <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest mt-0.5">
                              {formatDateFR(inv.periodStart)} → {formatDateFR(inv.periodEnd)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-sm font-black text-[#D4A853]">{inv.amount.toFixed(2)} €</p>
                            <p className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">TTC</p>
                          </div>
                          <button 
                            onClick={() => handleDownloadInvoice(inv)}
                            className="h-9 w-9 sm:h-10 sm:w-10 bg-white/5 text-[#D4A853] rounded-xl flex items-center justify-center hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-white/10 hover:border-[#D4A853] cursor-pointer shrink-0"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center text-white/15 font-semibold uppercase text-[10px] tracking-[0.2em]">Aucune facture disponible</div>
                )}
              </div>
            </section>
          </div>

          {/* COLONNE DROITE : PROFIL ET FLOTTE */}
          <div className="space-y-6">
            {/* INFOS COMPTE */}
            <div className="p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-[#D4A853]/10" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' }}>
              <h3 className="font-bold uppercase text-[10px] tracking-[0.2em] text-[#D4A853]/60 mb-6 pb-4 border-b border-white/5">Profil Membre</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-semibold text-white/25 uppercase tracking-widest ml-2 mb-1.5 block">Email enregistré</label>
                  <div className="p-4 bg-white/[0.03] rounded-xl text-[11px] font-semibold text-white/50 flex items-center gap-3 border border-white/5 overflow-hidden truncate">
                    <Mail size={14} className="text-[#D4A853]/40"/> {user.email}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-white/25 uppercase tracking-widest ml-2 mb-1.5 block">Identité</label>
                  <div className="p-4 bg-white/[0.03] rounded-xl text-[11px] font-bold text-white/70 uppercase tracking-tight border border-white/5">
                    {user.prenom} {user.nom}
                  </div>
                </div>
              </div>
            </div>

            {/* FLOTTE VÉHICULES */}
            <div className="p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-[#D4A853]/10 flex flex-col min-h-[350px] sm:min-h-[400px]" style={{ background: 'rgba(255,255,255,0.02)', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' }}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Car size={12} className="text-[#D4A853]/50" />
                  <h3 className="font-bold uppercase text-[10px] tracking-[0.2em] text-[#D4A853]/60">Mes voitures</h3>
                </div>
                <button onClick={handleAddCar} className="bg-[#D4A853]/10 text-[#D4A853] p-2 rounded-xl hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-[#D4A853]/20">
                  <Plus size={16}/>
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {user.cars?.map((car: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] p-4 rounded-2xl space-y-3 relative group border border-white/5 hover:border-[#D4A853]/20 transition-all">
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-bold uppercase text-white placeholder:text-white/15 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" 
                      value={car.model} 
                      placeholder="MODÈLE DU VÉHICULE"
                      onChange={(e) => {
                        const newCars = [...user.cars]; newCars[idx].model = e.target.value; setUser({...user, cars: newCars});
                      }} 
                    />
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-bold uppercase text-white placeholder:text-white/15 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" 
                      value={car.plate} 
                      placeholder="IMMATRICULATION"
                      onChange={(e) => {
                        const newCars = [...user.cars]; newCars[idx].plate = e.target.value; setUser({...user, cars: newCars});
                      }} 
                    />
                    {user.cars.length > 1 && (
                      <button onClick={() => handleRemoveCar(idx)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 shadow-lg transition-all">
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-5">
                {message && <p className="text-[9px] font-bold text-emerald-400 uppercase text-center mb-4 animate-pulse tracking-widest">{message}</p>}
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving} 
                  className="w-full gold-gradient text-[#0A0A0A] py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:shadow-lg hover:shadow-amber-900/20 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  <Save size={14} /> {isSaving ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default UserDashboard;