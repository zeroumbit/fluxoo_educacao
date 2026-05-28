import { useRBACInit } from '@/hooks/usePermissions';
import { useAuth } from '@/modules/auth/AuthContext';
import { useRBACStore } from '@/stores/rbac.store';
import { createContext, useContext, useMemo } from 'react';

interface RBACContextType {
  permissions: string[];
  deniedKeys: Set<string>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuth();
  const { isLoading } = useRBACInit();

  const storePermissions = useRBACStore(state => state.permissions);
  const storeDeniedKeys = useRBACStore(state => state.deniedKeys);
  const storeHasPermission = useRBACStore(state => state.hasPermission);

  const permissions = useMemo(
    () => storePermissions.map(p => p.permission_key),
    [storePermissions],
  );

  const hasPermission = useMemo(
    () => (perm: string) => {
      if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') return true;
      return storeHasPermission(perm);
    },
    [authUser?.role, storeHasPermission],
  );

  const hasRole = useMemo(
    () => (role: string) => authUser?.role === role,
    [authUser?.role],
  );

  const value: RBACContextType = useMemo(() => ({
    permissions,
    deniedKeys: storeDeniedKeys,
    hasPermission,
    hasRole,
    isLoading,
    error: null,
  }), [permissions, storeDeniedKeys, hasPermission, hasRole, isLoading]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export const usePermissions = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('usePermissions must be used within RBACProvider');
  }
  return context;
};
