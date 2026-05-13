import React, { useState } from 'react';
import { User, Car, Calendar, CreditCard } from 'lucide-react';

const AddClientForm: React.FC<{ slotId?: number }> = ({ slotId = 23 }) => {
  
    const [formData, setFormData] = useState<FormState>({
    nom: '',
    prenom: '',
    email: '',
    carModel: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const calculateProrata = (startDate: string): string => {
    const date = new Date(startDate);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - date.getDate() + 1;
    return ((240 / daysInMonth) * remainingDays).toFixed(2);
  };

  return (
    <div className="w-full">
      <div className="bg-indigo-600 p-8 pt-10 text-white">
        <h2 className="text-2xl font-black tracking-tight">Place P-{slotId}</h2>
        <p className="opacity-80 text-sm font-medium mt-1">Nouvelle assignation client</p>
      </div>
      <form className="p-8 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-widest">
            <User size={16} /> Informations Client
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nom</label>
              <input placeholder="Barthes" className="form-input w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prénom</label>
              <input placeholder="Yann" className="form-input w-full" />
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
            <input placeholder="yann@mail.com" type="email" className="form-input w-full" />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-widest">
            <Car size={16} /> Véhicule
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modèle</label>
              <input placeholder="Tesla Model 3" className="form-input w-full" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Immatriculation</label>
              <input placeholder="AA-123-BB" className="form-input w-full" />
            </div>
          </div>
        </section>

        <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            <Calendar size={14} /> Facturation
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date d'entrée</label>
              <input type="date" className="bg-transparent font-bold outline-none text-slate-700" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Loyer mensuel</span>
              <span className="text-3xl font-black text-indigo-600">{calculateProrata(formData.startDate)}€</span>
            </div>
          </div>
        </section>

        <button type="button" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
          <CreditCard size={20} /> Enregistrer & Facturer
        </button>
      </form>
    </div>
  );
};

export default AddClientForm;