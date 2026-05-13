import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Crown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants incorrects ou serveur injoignable');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A2E 50%, #0F0F0F 100%)' }}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)' }} />
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="w-14 h-14 sm:w-16 sm:h-16 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-amber-900/20 pulse-gold">
            <Crown size={24} className="text-[#0A0A0A] sm:hidden" />
            <Crown size={28} className="text-[#0A0A0A] hidden sm:block" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            KELVAL <span className="text-[#D4A853]">SARL</span>
          </h1>
          <p className="text-[#D4A853]/60 font-medium text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">Conciergerie Automobile de Prestige</p>
        </div>

        <div className="rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-[#D4A853]/10 animate-fade-in-up" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,168,83,0.1)' }}>
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-white/90" style={{ fontFamily: "'Playfair Display', serif" }}>Accès Membre</h2>
            <div className="w-12 h-[2px] gold-gradient mx-auto mt-3 rounded-full" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="text-rose-400 text-xs font-semibold text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/70 uppercase ml-1 tracking-[0.2em]">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-3.5 sm:top-4 text-[#D4A853]/30" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.fr" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-10 sm:pl-12 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 focus:bg-white/[0.07] transition-all outline-none" 
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#D4A853]/70 uppercase ml-1 tracking-[0.2em]">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-3.5 sm:top-4 text-[#D4A853]/30" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-[#D4A853]/50 focus:border-[#D4A853]/30 focus:bg-white/[0.07] transition-all outline-none" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-3.5 sm:top-4 text-white/20 hover:text-[#D4A853] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full gold-gradient text-[#0A0A0A] py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 sm:mt-4 uppercase text-xs sm:text-sm tracking-wider"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t border-white/5">
            <p className="text-xs sm:text-sm text-neutral-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-[#D4A853] font-semibold hover:text-[#F2D47A] transition-colors">
                S'inscrire ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;