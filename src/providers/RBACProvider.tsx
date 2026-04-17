import { createContext, useContext, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRBACInit as useLegacyInit } from '@/hooks/usePermissions';
import { useRBACStore } from '@/stores/rbac.store';
import { rbacService } from '@/modules/rbac/service';
import { QueryKeys } from '@/lib/query-keys';

interface RBACContextType {
  permissions: string[];
  deniedKeys: Set<string>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const RBACContext = createContext<RBACContextType | null>(null);

const USE_LEGACY_RBAC = import.meta.env.VITE_USE_LEGACY_RBAC === 'true';

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const user = authUser?.user;
  const tenantId = authUser?.tenantId;
  const isAuthenticated = !!authUser;

  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.RBAC(user?.id, tenantId),
    queryFn: async () => {
      if (!isAuthenticated || !tenantId || !user?.id) {
        return { permissions: [], deniedKeys: new Set<string>() };
      }

      // Bypass for super_admin and gestor
      if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
         return { permissions: [], deniedKeys: new Set<string>() };
      }
      
      const resolved = await rbacService.resolverPermissoes(user.id);
      const allowed: string[] = [];
      const denied = new Set<string>();

      for (const perm of resolved) {
        if (perm.source === 'override_deny') {
          denied.add(perm.permission_key);
        } else {
          allowed.push(perm.permission_key);
        }
      }

      return { permissions: allowed, deniedKeys: denied };
    },
    enabled: isAuthenticated && !!tenantId && !!user?.id && !USE_LEGACY_RBAC,
    staleTime: 10 * 60 * 1000,       // 10 minutos
    gcTime: 60 * 60 * 1000,          // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const permissions = useMemo(() => data?.permissions || [], [data]);
  const deniedKeys = useMemo(() => data?.deniedKeys || new Set<string>(), [data]);

  // Invalidação em tempo real via Supabase Realtime
  useEffect(() => {
    if (!user?.id || !tenantId || USE_LEGACY_RBAC) return;

    const channel = supabase
      .channel(`rbac-changes-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_permissions', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: QueryKeys.RBAC(user.id, tenantId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, tenantId, queryClient]);

  const hasPermission = useMemo(
    () => (perm: string) => permissions.includes(perm) && !deniedKeys.has(perm),
    [permissions, deniedKeys]
  );

  const hasRole = useMemo(
    () => (role: string) => authUser?.role === role,
    [authUser?.role]
  );

  const value: RBACContextType = useMemo(() => ({
    permissions,
    deniedKeys,
    hasPermission,
    hasRole,
    isLoading,
    error: error as Error | null,
  }), [permissions, deniedKeys, hasPermission, hasRole, isLoading, error]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export const usePermissions = (): RBACContextType => {
  const context = useContext(RBACContext);
  const { authUser } = useAuth();
  
  // Legacy Hook calls
  const legacyLoading = useLegacyInit().isLoading;
  const storeHasPermission = useRBACStore(state => state.hasPermission);
  const legacyPermissions = useRBACStore(state => state.permissions);

  if (USE_LEGACY_RBAC) {
    return {
      permissions: legacyPermissions.map(p => p.permission_key),
      deniedKeys: new Set<string>(), // Handled internally by store in legacy mode
      hasPermission: (key: string) => {
          // No modo legado, o useHasPermission da store trata o bypass de super_admin/gestor?
          // Não, a store trata permissões raw. O bypass é no hook legacy.
          if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') return true;
          return storeHasPermission(key);
      },
      hasRole: (role: string) => authUser?.role === role,
      isLoading: legacyLoading,
      error: null
    };
  }

  if (!context) {
    throw new Error('usePermissions must be used within RBACProvider');
  }

  return context;
};
