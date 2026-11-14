import type { ApiErrorPayload, User } from '../types/auth';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL ?? '';
  return raw.replace(/\/+$/, '');
}

function unwrapData<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function extractErrorMessage(payload: ApiErrorPayload | null, fallback: string): { code: string; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { code: 'API_ERROR', message: fallback };
  }
  if (typeof payload.error === 'object' && payload.error !== null) {
    return {
      code: payload.error.code || 'API_ERROR',
      message: payload.error.message || fallback,
    };
  }
  if (typeof payload.error === 'string') {
    return { code: 'API_ERROR', message: payload.error };
  }
  if (typeof payload.message === 'string') {
    return { code: 'API_ERROR', message: payload.message };
  }
  return { code: 'API_ERROR', message: fallback };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let parsedBody: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }
  } else {
    const text = await response.text();
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = { message: text };
      }
    }
  }

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? 'Invalid email or password'
        : `Request failed with status ${response.status}`;
    const { code, message } = extractErrorMessage(parsedBody as ApiErrorPayload | null, fallback);
    throw new ApiError(response.status, code, message);
  }

  return unwrapData<T>(parsedBody);
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    return apiRequest<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return apiRequest<User>('/api/auth/me', {
      method: 'GET',
    });
  },

  async logout(): Promise<void> {
    await apiRequest<{ message?: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

