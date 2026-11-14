export type Role = 'USER' | 'ADMINISTRATOR';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateCategoryInput {
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount?: string | number;
  amountSatang?: number;
  transactionDate: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    type?: TransactionType;
  };
  note?: string | null;
  createdAt?: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  transactionDate: string;
  note?: string;
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
