import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Plus, Trash2, Crown, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: ''
  });
  const [cars, setCars] = useState([{ model: '', plate: '' }]);
  const [popup, setPopup] = useState<{show: boolean, type: 'success'|'error', message: string}>({ show: false, type: 'success', message: '' });
  const navigate = useNavigate();

  const handleAddCar = () => setCars([...cars, { model: '', plate: '' }]);
  
  const handleRemoveCar = (index: number) => {
    if (cars.length > 1) setCars(cars.filter((_, i) => i !== index));
  };

  const handleCarChange = (index: number, field: string, value: string) => {
    const newCars = [...cars];
    newCars[index] = { ...newCars[index], [field]: value };
    setCars(newCars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', { ...formData, cars });
      setPopup({ show: true, type: 'success', message: 'Bienvenue chez KELVAL SARL — votre compte a été créé.' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Erreur lors de l'inscription. Veuillez vérifier vos informations.";
      setPopup({ show: true, type: 'error', message: errorMsg });
      setTimeout(() => setPopup(p => ({...p, show: false})), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 50%, #0F0F0F 100%)' }}>
      
      {/* POPUP STYLÉE */}
      {popup.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className={`px-5 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
            popup.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {popup.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            <p className="font-bold text-xs sm:text-sm">{popup.message}</p>
          </div>
        </div>
      )}

      {/* Decorative ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] rounded-full opacity-[0.025]" style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }} />

      <div className="max-w-2xl w-full relative z-10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-[#D4A853]/10 animate-fade-in-up" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,168,83,0.1)' }}>
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 gold-gradient rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-amber-900/20">
            <Crown size={20} className="text-[#0A0A0A] sm:hidden" />
            <Crown size={24} className="text-[#0A0A0A] hidden sm:block" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            KELVAL <span className="text-[#D4A853]">SARL</span>
          </h1>
          <p className="text-[#D4A853]/50 font-semibold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">Inscription — Conciergerie Automobile</p>
          <div className="w-12 h-[2px] gold-gradient mx-auto mt-3 sm:mt-4 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/60 uppercase ml-2 tracking-[0.2em]">Nom</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" placeholder="Votre nom" onChange={e => setFormData({...formData, nom: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/60 uppercase ml-2 tracking-[0.2em]">Prénom</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" placeholder="Votre prénom" onChange={e => setFormData({...formData, prenom: e.target.value})} required />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/60 uppercase ml-2 tracking-[0.2em]">Email</label>
              <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" placeholder="email@domaine.com" onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/60 uppercase ml-2 tracking-[0.2em]">Mot de passe</label>
              <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center px-1 sm:px-2">
              <div className="flex items-center gap-2">
                <Car size={14} className="text-[#D4A853]/70" />
                <h3 className="text-[10px] sm:text-xs font-bold text-[#D4A853]/80 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Votre Flotte</h3>
              </div>
              <button type="button" onClick={handleAddCar} className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold bg-[#D4A853]/10 text-[#D4A853] px-3 sm:px-4 py-1.5 rounded-full hover:bg-[#D4A853] hover:text-[#0A0A0A] transition-all border border-[#D4A853]/20">
                <Plus size={12}/> Ajouter
              </button>
            </div>
            
            {cars.map((car, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center animate-fade-in-up">
                <input type="text" placeholder="Modèle (Porsche 911...)" className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" value={car.model} onChange={e => handleCarChange(index, 'model', e.target.value)} required />
                <div className="flex gap-3 items-center">
                  <input type="text" placeholder="Immatriculation" className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 outline-none transition-all" value={car.plate} onChange={e => handleCarChange(index, 'plate', e.target.value)} required />
                  {cars.length > 1 && <button type="button" onClick={() => handleRemoveCar(index)} className="text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 p-2 sm:p-2.5 rounded-xl transition-all shrink-0"><Trash2 size={16}/></button>}
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full gold-gradient text-[#0A0A0A] py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] font-black shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 hover:-translate-y-0.5 transition-all uppercase text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em]">
            Devenir Membre KELVAL
          </button>
        </form>
        <p className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-neutral-500">
          Déjà membre ? <Link to="/login" className="text-[#D4A853] font-semibold hover:text-[#F2D47A] transition-colors">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;