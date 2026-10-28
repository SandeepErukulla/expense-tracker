import api from './api';
import type { Expense } from '../types';

export const getExpenses = async (userId: number = 1): Promise<Expense[]> => {
  const response = await api.get<Expense[]>(`/expenses/user/${userId}`);
  return response.data;
};

export const createExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const response = await api.post<Expense>('/expenses', expense);
  return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};