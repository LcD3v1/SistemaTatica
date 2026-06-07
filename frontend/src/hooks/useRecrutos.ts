import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import type { Recruta } from '@/types'

export function useRecrutos() {
  return useQuery<Recruta[]>({
    queryKey: ['recrutas'],
    queryFn: async () => (await api.get<Recruta[]>('/recrutas')).data,
  })
}

export function useCreateRecruta() {
  return useMutation({
    mutationFn: (body: Omit<Recruta, 'id'>) => api.post<Recruta>('/recrutas', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recrutas'] }),
  })
}

export function useDeleteRecruta() {
  return useMutation({
    mutationFn: (id: number) => api.delete(`/recrutas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recrutas'] }),
  })
}
