import { useQuery } from '@tanstack/react-query'
import { bannersService } from './banners.service'

export function useActiveBanners(cidade: string | undefined) {
  return useQuery({
    queryKey: ['school', 'banners', cidade],
    queryFn: () => bannersService.getActiveBanners(cidade || ''),
    enabled: !!cidade,
    staleTime: 5 * 60 * 1000,
  })
}
