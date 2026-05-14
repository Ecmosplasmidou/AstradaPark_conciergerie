import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 50%, #0F0F0F 100%)' }}>
      {/* Decorative ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }} />

      <div className="max-w-md w-full relative z-10 text-center animate-fade-in-up">
        <div className="w-20 h-20 gold-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-900/20 pulse-gold">
          <AlertTriangle size={36} className="text-[#0A0A0A]" />
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          404
        </h1>
        
        <div className="w-12 h-[2px] gold-gradient mx-auto mb-6 rounded-full" />
        
        <h2 className="text-xl sm:text-2xl font-bold text-white/90 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Page introuvable
        </h2>
        
        <p className="text-sm text-neutral-400 mb-10 px-4 leading-relaxed">
          La page que vous recherchez semble ne pas exister, a été déplacée ou est temporairement indisponible.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl gold-gradient text-[#0A0A0A] font-black uppercase text-xs tracking-widest hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/30 transition-all active:scale-95"
        >
          <Home size={16} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
