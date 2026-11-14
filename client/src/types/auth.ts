export type Role = 'USER' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  } | string;
  message?: string;
}

