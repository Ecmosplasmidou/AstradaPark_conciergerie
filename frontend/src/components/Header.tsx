import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, User as UserIcon, ChevronDown, Crown } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (location.pathname === '/login' || location.pathname === '/register' || !user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    setIsOpen(false);
    setShowDropdown(false);
  };

  const initial = user.prenom ? user.prenom.charAt(0).toUpperCase() : user.nom.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-2xl border-b border-[#D4A853]/10 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 gold-gradient rounded-xl flex items-center justify-center text-[#0A0A0A] font-black shadow-lg shadow-amber-900/20 group-hover:scale-105 transition-transform text-xs shrink-0">
            <Crown size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-base sm:text-lg tracking-tight text-white uppercase truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              KELVAL<span className="text-[#D4A853]"> SARL</span>
            </span>
            <span className="text-[7px] sm:text-[8px] font-semibold text-[#D4A853]/60 uppercase tracking-[0.25em] sm:tracking-[0.35em] -mt-0.5 hidden xs:block">Conciergerie Automobile</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link 
            to={user.role === 'admin' ? "/admin" : "/user"} 
            className="px-3 lg:px-4 py-2 rounded-xl text-sm font-semibold text-neutral-400 hover:text-[#D4A853] hover:bg-white/5 transition-all"
          >
            {user.role === 'admin' ? 'Administration' : 'Mon Espace'}
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 lg:gap-3 pl-4 lg:pl-6 border-l border-white/10 group"
            >
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-white/90 leading-none group-hover:text-[#D4A853] transition-colors">{user.prenom} {user.nom}</p>
                <p className="text-[9px] font-semibold text-[#D4A853]/70 uppercase tracking-widest mt-1">{user.role === 'admin' ? 'Administrateur' : 'Membre'}</p>
              </div>
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-[#0A0A0A] font-black shadow-md border-2 border-[#D4A853]/30 group-hover:border-[#D4A853] transition-all">
                {initial}
              </div>
              <ChevronDown size={14} className={`text-[#D4A853]/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-52 bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#D4A853]/15 py-2 animate-fade-in-up">
                <div className="px-5 py-3 border-b border-white/5 lg:hidden">
                  <p className="text-xs font-bold text-white/80">{user.prenom} {user.nom}</p>
                  <p className="text-[9px] text-[#D4A853]/60 uppercase">{user.role === 'admin' ? 'Administrateur' : 'Membre'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-5 py-3 w-full text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors rounded-xl mx-auto"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

        <button 
          className="md:hidden p-2 text-[#D4A853] hover:bg-white/5 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`md:hidden absolute top-full left-0 w-full bg-[#0A0A0A] border-b border-[#D4A853]/10 shadow-2xl transition-all duration-300 origin-top ${
        isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
      }`}>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white/5 rounded-2xl mb-3 border border-[#D4A853]/10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gold-gradient flex items-center justify-center text-[#0A0A0A] font-black text-lg sm:text-xl shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm sm:text-base truncate">{user.prenom} {user.nom}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-[#D4A853]/70 uppercase">{user.role === 'admin' ? 'Administrateur' : 'Membre'}</p>
            </div>
          </div>

          <Link 
            to={user.role === 'admin' ? "/admin" : "/user"}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 sm:p-4 w-full font-bold text-neutral-300 hover:bg-white/5 hover:text-[#D4A853] rounded-2xl transition-all text-sm"
          >
            {user.role === 'admin' ? <LayoutDashboard size={18} /> : <UserIcon size={18} />}
            {user.role === 'admin' ? 'Administration' : 'Mon Espace'}
          </Link>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 sm:p-4 w-full font-bold text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-colors text-sm"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;