/** Configuracao do cliente HTTP — trocar baseUrl quando integrar Supabase/API real */
export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => string | null;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Cliente HTTP base — implementacao real sera usada quando o backend estiver pronto.
 * Por ora, os repositorios mock nao utilizam este client.
 */
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.request(path, { method: 'GET' });
    return response as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.request(path, { method: 'POST', body: JSON.stringify(body) });
    return response as T;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await this.request(path, { method: 'PUT', body: JSON.stringify(body) });
    return response as T;
  }

  async delete(path: string): Promise<void> {
    await this.request(path, { method: 'DELETE' });
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const token = this.config.getAuthToken?.();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.config.baseUrl}${path}`, { ...init, headers });

    if (!response.ok) {
      throw new ApiError(`API error: ${response.statusText}`, response.status);
    }

    if (response.status === 204) return undefined;
    return response.json();
  }
}

/** Instancia global — configurar VITE_API_URL no .env quando integrar */
export const apiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  getAuthToken: () => localStorage.getItem('auth_token'),
});
