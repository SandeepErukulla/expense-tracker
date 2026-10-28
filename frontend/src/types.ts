export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Expense {
  id?: number;
  userId: number;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  description: string;
}