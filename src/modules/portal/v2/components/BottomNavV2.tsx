import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Receipt, Bell, ShoppingBag, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// Mock function for TanStack Query - Checking if any store items exist for the tenant
const fetchLojaStatus = async () => {
  // Simulating an API call that returns the view vw_marketplace_global for the tenant
  return new Promise<{ length: number }>((resolve) => {
    setTimeout(() => {
      resolve({ length: 1 }); // Change to 0 to test hiding the tab
    }, 500);
  });
};

export const BottomNavV2 = () => {
  const location = useLocation();

  // "Se retornar length > 0, a aba LOJA é renderizada na navegação. Se retornar 0, a aba não existe."
  const { data: lojaRequest } = useQuery({
    queryKey: ['portal-loja-status'],
    queryFn: fetchLojaStatus,
  });

  const showLoja = lojaRequest ? lojaRequest.length > 0 : false;

  const baseItems = [
    { label: 'Home', icon: Home, path: '/portal' },
    { label: 'Alunos', icon: Users, path: '/portal/alunos' },
    { label: 'Financeiro', icon: Receipt, path: '/portal/financeiro' },
    { label: 'Avisos', icon: Bell, path: '/portal/avisos' },
  ];

  if (showLoja) {
    baseItems.push({ label: 'Loja', icon: ShoppingBag, path: '/portal/loja' });
  }

  // O Menu Perfil (hambúrguer) é o último item fixo
  const navItems = [...baseItems, { label: 'Perfil', icon: Menu, path: '/portal/perfil' }];

  return (
    // Safe area bottom para dispositivos com home indicator (iOS)
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom,0px)] z-50 rounded-t-[28px] shadow-[0_-2px_20px_rgba(0,0,0,0.04)]">
      {/* 
        Bottom Navigation - Padrão nativo iOS/Android
        - Touch targets: 48px mínimo (Android) / 44pt (iOS)
        - Ícones: 24px (SF Symbols / Material Icons equivalent)
        - Labels: 11-12px (Caption/Material Label Small)
      */}
      <div className="flex justify-around items-center px-1 py-2 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/portal' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-[68px] h-[60px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors touch-manipulation"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Background ripple/press effect - padrão Material Design */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-1 bg-teal-50/70 rounded-[14px] -z-0"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  aria-hidden="true"
                />
              )}
              
              {/* Ícone - 24px padrão SF Symbols / Material Icons */}
              <div className="relative flex items-center justify-center z-10 w-12 h-12">
                <item.icon
                  size={24}
                  className={`transition-all duration-200 ${
                    isActive ? 'text-teal-500' : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
              </div>
              
              {/* Label - Caption 1 iOS / Label Small Material */}
              <span
                className={`text-[11px] font-medium leading-tight transition-all duration-200 ${
                  isActive ? 'text-teal-600 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
