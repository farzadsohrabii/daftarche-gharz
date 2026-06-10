export type DebtItem = {
  id: string;
  debtor_id: string;
  user_id?: string;
  amount: number;
  debt_date: string;
  note?: string | null;
  created_at?: string;
};

export type Debtor = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  date?: string;
  created_at?: string;
  debts?: DebtItem[];
};