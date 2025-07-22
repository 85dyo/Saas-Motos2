import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  UserCircle, 
  Settings, 
  Menu,
  X,
  LogOut,
  Wrench,
  DollarSign,
  Package,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NavItem } from '../../types';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Ordens de Serviço', href: '/os', icon: FileText },
    { name: 'Estoque', href: '/estoque', icon: Package },
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
    { name: 'Automações', href: '/automacoes', icon: Wrench },
    { name: 'Usuários', href: '/usuarios', icon: UserCircle, adminOnly: true },
    { name: 'Configurações', href: '/configuracoes', icon: Settings, adminOnly: true },
    { name: 'Campos Customizados', href: '/campos', icon: Sliders, adminOnly: true }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Wrench className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">MotoGestor</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
          <div className="relative flex w-64 flex-col bg-white h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;