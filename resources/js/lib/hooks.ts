import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, errorMessage } from './api';

/** GET simples com cache. A chave é a própria URL + params. */
export function useGet<T>(url: string | null, params?: Record<string, unknown>, opts?: Partial<UseQueryOptions<T>>) {
  return useQuery<T>({
    queryKey: [url, params],
    queryFn: async () => (await api.get<T>(url!, { params })).data,
    enabled: !!url,
    ...opts,
  });
}

type Method = 'post' | 'put' | 'delete';

/**
 * Mutação genérica. Depois de qualquer alteração invalida todo o cache —
 * o app é pequeno e assim saldos/dashboards ficam sempre consistentes.
 */
export function useSend<TBody = unknown, TRes = unknown>(method: Method, url: string | ((b: TBody) => string), success?: string) {
  const qc = useQueryClient();
  return useMutation<TRes, unknown, TBody>({
    mutationFn: async (body: TBody) => {
      const u = typeof url === 'function' ? url(body) : url;
      const res = method === 'delete' ? await api.delete(u) : await api[method](u, body);
      return res.data as TRes;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      if (success) toast.success(success);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
