import { Outlet, useNavigate, useLocation } from 'react-router';
import { Store, Bell, Truck, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/shared/lib/api';

const PRIMARY = '#122a4c';

export function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeName, setStoreName] = useState('São Jorge Super');

  const user = (() => {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    if (user?.loja_id) {
      api.get(`/lojas/${user.loja_id}`).then(res => {
        if (res.data?.success) setStoreName(res.data.data.nome);
      }).catch(() => {});
    }
  }, [user?.loja_id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Minhas Entregas', icon: Truck, path: '/driver' },
    { label: 'Sair', icon: LogOut, path: '/login', action: handleLogout },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Topbar */}
      <header className="text-white px-4 h-16 flex items-center justify-between shadow-md shrink-0 z-50" style={{ backgroundColor: PRIMARY }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-white/60 leading-tight uppercase tracking-wider font-bold">
              {storeName}
            </span>
            <span className="text-sm font-semibold truncate">
              {user?.nome || 'Usuário'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Disponível</span>
          </div>
          <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2" style={{ borderColor: PRIMARY }} />
          </button>
        </div>
      </header>

      {/* Faixa de turno (mobile only) */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>Turno ativo · Disponível para rotas</span>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative">
        <div className="max-w-3xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 bg-white border-t border-gray-200 flex items-center shrink-0 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/driver' && location.pathname.startsWith('/driver/route'));
          const isLogout = item.label === 'Sair';
          
          return (
            <button
              key={item.label}
              onClick={() => item.action ? item.action() : navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-[#122a4c]' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
