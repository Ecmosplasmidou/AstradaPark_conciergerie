import React, { useEffect, useState } from 'react';
import { Car, Mail, Plus, Trash2, Save, MapPin, Calendar, Receipt, Download, Send, CheckCircle2, AlertTriangle, Users, Shield } from 'lucide-react';
import api from '../services/api';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';


const UserDashboard = () => {
  const [user, setUser] = useState<any>({ nom: '', prenom: '', email: '', cars: [] });
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'parking' | 'messages'>('parking');
  const [messages, setMessages] = useState<any[]>([]);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [carDeleteError, setCarDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData) {
      setUser({ ...userData, cars: userData.cars || [] });
    }
    fetchMySlots(userData.email);
    fetchInvoices();
    fetchMessages();
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

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages/my');
      setMessages(response.data);
    } catch (e) { console.error(e); }
  };

  const handleAddCar = () => {
    setUser({ ...user, cars: [...(user.cars || []), { model: '', plate: '' }] });
  };

  const handleRemoveCar = (index: number) => {
    const carToRemove = user.cars[index];
    const isStationed = mySlots.some((slot) => slot.licensePlate === carToRemove.plate);

    if (isStationed) {
      setCarDeleteError(`Impossible de supprimer le véhicule ${carToRemove.plate} car il est actuellement stationné sur une place.`);
      return;
    }

    const newCars = user.cars.filter((_: any, i: number) => i !== index);
    setUser({ ...user, cars: newCars });
    setCarDeleteError(null);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject || !msgContent) return;
    setIsSendingMsg(true);
    try {
      await api.post('/messages', { subject: msgSubject, content: msgContent });
      setMsgSubject('');
      setMsgContent('');
      alert("Votre message a été envoyé avec succès !");
      fetchMessages();
    } catch (error) {
      alert("Erreur lors de l'envoi du message");
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleReplyMessage = async (id: string) => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
    try {
      await api.post(`/messages/${id}/reply`, { content: replyContent });
      setReplyContent('');
      fetchMessages();
    } catch (error) {
      alert("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsReplying(false);
    }
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
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <p className="text-[#D4A853]/50 font-semibold text-[10px] uppercase tracking-[0.3em] mb-2">Espace Membre</p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bonjour, <span className="text-[#D4A853]">{user.prenom}</span>
            </h1>
          </div>
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setActiveTab('parking')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'parking' ? 'bg-[#D4A853] text-black shadow-lg shadow-[#D4A853]/20' : 'text-white/50 hover:text-white'}`}
            >
              Tableau de bord
            </button>
            <button 
              onClick={() => setActiveTab('messages')} 
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'messages' ? 'bg-[#D4A853] text-black shadow-lg shadow-[#D4A853]/20' : 'text-white/50 hover:text-white'}`}
            >
              Messagerie
              {messages.some((m: any) => m.status === 'traité') && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 border-2 border-[#1A1A1A] animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        {/* MODALE D'ERREUR SUPPRESSION VOITURE */}
        {carDeleteError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[2rem] p-8 text-center space-y-6 border border-rose-500/20 animate-fade-in-up" style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #111 100%)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Action impossible</h3>
                <p className="text-white/60 text-sm mt-3">{carDeleteError}</p>
              </div>
              <button onClick={() => setCarDeleteError(null)} className="w-full bg-white/10 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all">
                Fermer
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* COLONNE GAUCHE : CONTENU PRINCIPAL */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'parking' ? (
              <>
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
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 ml-1">
                      <Receipt size={12} className="text-[#D4A853]/50" />
                      <h3 className="text-[10px] font-semibold text-[#D4A853]/60 uppercase tracking-[0.3em]">Mes Factures ({invoices.length})</h3>
                    </div>
                    {/* NOUVEAU STYLE DE FILTRE FACTURES */}
                    {invoices.length > 0 && (() => {
                      const months = Array.from(new Set(invoices.map(inv => {
                        const d = new Date(inv.periodStart);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      }))).sort((a, b) => b.localeCompare(a));
                      
                      return (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                          <button 
                            onClick={() => setInvoiceFilterMonth('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${invoiceFilterMonth === 'all' ? 'bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}
                          >
                            Toutes
                          </button>
                          {months.map(m => {
                            const [year, month] = m.split('-');
                            const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                            return (
                              <button 
                                key={m}
                                onClick={() => setInvoiceFilterMonth(m)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${invoiceFilterMonth === m ? 'bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-transparent'}`}
                              >
                                {monthName}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="rounded-[2rem] border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {invoices.length > 0 ? (
                      <div className="divide-y divide-white/5 animate-fade-in-up">
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
              </>
            ) : (
              /* SECTION MESSAGERIE */
              <div className="rounded-[2rem] border border-white/5 overflow-hidden flex flex-col min-h-[600px] animate-fade-in-up" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01]">
                  <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Mes <span className="text-[#D4A853]">Messages</span></h2>
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-1">Communiquez avec l'équipe Astrada</p>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Formulaire Nouveau Message OU Liste des messages */}
                  <div className={`md:w-1/3 border-r border-white/5 overflow-y-auto no-scrollbar bg-black/20 flex flex-col ${expandedMessageId ? 'hidden md:flex' : 'flex'}`}>
                    {/* Bouton Nouveau Message */}
                    <div className="p-4 border-b border-white/5 shrink-0">
                      <button 
                        onClick={() => setExpandedMessageId(null)}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          !expandedMessageId ? 'bg-[#D4A853] text-black shadow-lg shadow-[#D4A853]/20' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <Send size={14} /> Nouveau Ticket
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
                      {messages.length > 0 ? messages.map((msg: any) => (
                        <div 
                          key={msg._id} 
                          onClick={() => setExpandedMessageId(msg._id)}
                          className={`p-5 cursor-pointer transition-colors border-l-2 ${
                            expandedMessageId === msg._id 
                              ? 'bg-white/[0.04] border-[#D4A853]' 
                              : 'border-transparent hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest border ${
                              msg.status === 'nouveau' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                              msg.status === 'traité' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              'bg-white/5 text-white/50 border-white/10'
                            }`}>
                              {msg.status}
                            </div>
                            <p className="text-[8px] text-white/20 uppercase tracking-widest mt-0.5">{formatDateFR(msg.createdAt)}</p>
                          </div>
                          <h4 className={`text-sm mb-1 truncate ${expandedMessageId === msg._id ? 'font-black text-[#D4A853]' : 'font-bold text-white/80'}`}>{msg.subject}</h4>
                          <p className="text-[10px] text-white/40 truncate">{msg.initialMessage || msg.content}</p>
                        </div>
                      )) : (
                        <div className="p-10 text-center text-white/15">
                          <p className="font-semibold uppercase text-[10px] tracking-[0.2em]">Aucun message</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenu principal (Nouveau Message ou Fil de discussion) */}
                  <div className="flex-1 flex flex-col bg-[#0A0A0A]/50 relative h-[500px] md:h-auto">
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
                              <div className={`px-2 py-0.5 rounded-md inline-block text-[8px] font-bold uppercase tracking-widest border ${
                                msg.status === 'nouveau' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                msg.status === 'traité' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                'bg-white/5 text-white/50 border-white/10'
                              }`}>
                                Statut : {msg.status}
                              </div>
                            </div>
                          </div>

                          {/* Zone des messages (scrollable) */}
                          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                            {/* Message initial (User) */}
                            <div className="flex gap-4 max-w-[85%] self-end flex-row-reverse">
                              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/50 shrink-0 mt-1">
                                <Users size={14} />
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                  <span className="text-[8px] text-white/30">{new Date(msg.createdAt).toLocaleString('fr-FR')}</span>
                                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Vous</span>
                                </div>
                                <div className="bg-[#D4A853]/10 border border-[#D4A853]/20 p-4 rounded-2xl rounded-tr-sm text-sm text-[#D4A853]/90 leading-relaxed shadow-sm text-left">
                                  {msg.initialMessage || msg.content}
                                </div>
                              </div>
                            </div>

                            {/* Fallback old schema adminReply */}
                            {msg.adminReply && (!msg.replies || msg.replies.length === 0) && (
                              <div className="flex gap-4 max-w-[85%] self-start">
                                <div className="w-8 h-8 rounded-xl bg-[#D4A853]/20 flex items-center justify-center text-[#D4A853] shrink-0 mt-1">
                                  <Shield size={14} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest">Support Astrada</span>
                                    <span className="text-[8px] text-[#D4A853]/50">{new Date(msg.updatedAt).toLocaleString('fr-FR')}</span>
                                  </div>
                                  <div className="bg-white/[0.05] border border-white/10 p-4 rounded-2xl rounded-tl-sm text-sm text-white/80 leading-relaxed shadow-sm">
                                    {msg.adminReply}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Liste des réponses (nouveau schéma) */}
                            {msg.replies && msg.replies.map((reply: any, idx: number) => (
                              <div key={idx} className={`flex gap-4 max-w-[85%] ${reply.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${reply.sender === 'user' ? 'bg-white/10 text-white/50' : 'bg-[#D4A853]/20 text-[#D4A853]'}`}>
                                  {reply.sender === 'user' ? <Users size={14} /> : <Shield size={14} />}
                                </div>
                                <div className={reply.sender === 'user' ? 'text-right' : 'text-left'}>
                                  <div className={`flex items-center gap-2 mb-1 ${reply.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {reply.sender === 'user' ? (
                                      <>
                                        <span className="text-[8px] text-white/30">{new Date(reply.createdAt).toLocaleString('fr-FR')}</span>
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Vous</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[10px] font-bold text-[#D4A853] uppercase tracking-widest">Support Astrada</span>
                                        <span className="text-[8px] text-[#D4A853]/50">{new Date(reply.createdAt).toLocaleString('fr-FR')}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm text-left ${
                                    reply.sender === 'user' 
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
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Répondre au support..."
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
                                  disabled={!replyContent.trim() || isReplying}
                                  className="bg-[#D4A853] text-black w-[60px] rounded-2xl flex items-center justify-center hover:bg-[#e2b865] hover:shadow-lg hover:shadow-[#D4A853]/20 transition-all disabled:opacity-50"
                                >
                                  <Send size={20} className={isReplying ? "animate-pulse" : ""} />
                                </button>
                              </div>
                              <p className="text-[9px] text-white/30 mt-2 text-center uppercase tracking-widest">Appuyez sur Entrée pour envoyer</p>
                            </div>
                          )}
                          {msg.status === 'clôturé' && (
                            <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0 text-center">
                              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest"><CheckCircle2 size={12} className="inline mr-1 -mt-0.5" /> Ce ticket a été clôturé.</p>
                            </div>
                          )}
                        </>
                      );
                    })() : (
                      <div className="p-6 sm:p-8 flex-1 overflow-y-auto no-scrollbar">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Créer un nouveau ticket</h3>
                        <form onSubmit={handleSendMessage} className="space-y-4 max-w-xl">
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Sujet de la demande</label>
                            <input 
                              type="text" 
                              required
                              value={msgSubject}
                              onChange={(e) => setMsgSubject(e.target.value)}
                              placeholder="Ex: Demande de lavage, problème de facturation..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/30 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Votre message</label>
                            <textarea 
                              required
                              value={msgContent}
                              onChange={(e) => setMsgContent(e.target.value)}
                              placeholder="Détaillez votre demande ici..."
                              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/30 outline-none resize-none transition-all"
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={isSendingMsg || !msgSubject || !msgContent}
                            className="w-full sm:w-auto bg-[#D4A853] text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e2b865] disabled:opacity-50 transition-all shadow-lg shadow-[#D4A853]/20 flex items-center justify-center gap-2"
                          >
                            {isSendingMsg ? 'Envoi en cours...' : <><Send size={14} /> Envoyer la demande</>}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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