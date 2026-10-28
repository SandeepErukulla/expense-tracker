import React, { useState } from 'react';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          title,
          amount: Number(amount),
          category,
          expenseDate,
          description
        })
      });

      if (response.ok) {
        setTitle('');
        setAmount('');
        setCategory('');
        setExpenseDate('');
        setDescription('');
        onExpenseAdded();
      }
    } catch (err) {
      console.error('Failed to create expense', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Add New Expense</h3>
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
      <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} required style={inputStyle} />
      <input type="text" placeholder="Category (e.g., Food)" value={category} onChange={(e) => setCategory(e.target.value)} required style={inputStyle} />
      <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required style={inputStyle} />
      <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
      <button type="submit" style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        Save Expense
      </button>
    </form>
  );
}

const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' };