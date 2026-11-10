import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'fin_token';

export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Extrai uma mensagem legível de um erro da API (validação do Laravel ou abort). */
export function errorMessage(error: unknown): string {
  const e = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  const data = e?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0] ?? 'Erro de validação';
  return data?.message || e?.message || 'Erro inesperado';
}

export async function baixarDocumento(id: number, nome: string) {
  const res = await api.get(`/documentos/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
