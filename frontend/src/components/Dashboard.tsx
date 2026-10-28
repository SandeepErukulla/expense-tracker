import React, { useState, useEffect, useMemo } from 'react';

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
}

interface DashboardProps {
  username: string;
  userId: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ username, userId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const [categories, setCategories] = useState<string[]>(['Food', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Other']);
  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/expenses/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchExpenses();
    }
  }, [userId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingCustom && customCategory.trim() ? customCategory.trim() : category;

    if (!categories.includes(finalCategory)) {
      setCategories([...categories, finalCategory]);
    }

    const res = await fetch('http://localhost:8080/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category: finalCategory,
        expenseDate,
        userId
      }),
    });

    if (res.ok) {
      setTitle('');
      setAmount('');
      setIsAddingCustom(false);
      setCustomCategory('');
      fetchExpenses();
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`http://localhost:8080/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchExpenses();
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID,Title,Category,Amount,Date'];
    const rows = filteredExpenses.map(e => `${e.id},"${e.title}",${e.category},${e.amount},${e.expenseDate}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        if (searchQuery && !exp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterCategory !== 'ALL' && exp.category !== filterCategory) return false;

        const expDate = new Date(exp.expenseDate);
        const now = new Date();

        if (filterPeriod === 'THIS_MONTH') {
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        }
        if (filterPeriod === 'LAST_MONTH') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
        }
        if (filterPeriod === 'LAST_QUARTER') {
          const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          const lastQuarterEnd = new Date(now.getFullYear(), currentQuarterStartMonth, 0);
          const lastQuarterStart = new Date(lastQuarterEnd.getFullYear(), lastQuarterEnd.getMonth() - 2, 1);
          return expDate >= lastQuarterStart && expDate <= lastQuarterEnd;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'date') {
          comp = new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
        } else {
          comp = a.amount - b.amount;
        }
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [expenses, searchQuery, filterCategory, filterPeriod, sortBy, sortOrder]);

  const totalSpend = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
  }, [filteredExpenses]);

  const topCategory = useMemo(() => {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [categoryTotals]);

  const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'];

  let cumulativePercent = 0;
  const gradientStops = Object.entries(categoryTotals).map(([cat, amt], index) => {
    const percentage = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
    const start = cumulativePercent;
    cumulativePercent += percentage;
    return `${colors[index % colors.length]} ${start}% ${cumulativePercent}%`;
  }).join(', ');

  const monthlyTotals = useMemo(() => {
    return expenses.reduce((acc: { [key: string]: number }, curr) => {
      const monthKey = curr.expenseDate.substring(0, 7);
      acc[monthKey] = (acc[monthKey] || 0) + curr.amount;
      return acc;
    }, {});
  }, [expenses]);

  const sortedMonths = Object.keys(monthlyTotals).sort();
  const maxMonthlyAmount = Math.max(...Object.values(monthlyTotals), 100);

  return (
    <div style={{ padding: '2.5rem 1.5rem', fontFamily: "'Inter', system-ui, sans-serif", color: '#f8fafc' }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>

        {/* Header section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#ffffff' }}>
              Expense Intelligence
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
              Financial command center for <strong style={{ color: '#818cf8' }}>{username}</strong>[cite: 1, 2, 3]. Real-time tracking enabled.
            </p>
          </div>
          <button
            onClick={exportToCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '0.875rem', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
          >
            📊 Export CSV Report
          </button>
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.25rem' }}>

          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#818cf8' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Total Active Spend</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'block', marginTop: '0.35rem' }}>● Live calculation</span>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#34d399' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Recorded Transactions</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>{filteredExpenses.length}</div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginTop: '0.35rem' }}>Filtered items count</span>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#fbbf24' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Top Spend Category</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8', marginTop: '0.5rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topCategory}</div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginTop: '0.35rem' }}>Primary drain sector</span>
          </div>

        </div>

        {/* Add Expense Form Card */}
        <div style={{ background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(16px)', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', marginBottom: '2.25rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>+</span>
            Add New Expense
          </h3>

          <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', alignItems: 'end' }}>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
              <input
                type="text"
                placeholder="e.g. Flight tickets"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
              {!isAddingCustom ? (
                <select
                  value={category}
                  onChange={(e) => e.target.value === 'CUSTOM_NEW' ? setIsAddingCustom(true) : setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="CUSTOM_NEW" style={{ fontWeight: 'bold', color: '#818cf8' }}>+ Custom Category</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    placeholder="Custom name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    style={{ flex: 1, padding: '0.75rem 0.6rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.85rem', background: '#0f172a', color: '#fff' }}
                  />
                  <button type="button" onClick={() => setIsAddingCustom(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: 'none', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff' }}
              />
            </div>

            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', padding: '0.8rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', transition: 'all 0.2s', height: '46px' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Add Expense
            </button>
          </form>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.25rem' }}>

          {/* Donut Chart Card */}
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Category Breakdown</h3>
            {totalSpend === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.875rem' }}>No data available</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '155px', height: '155px', flexShrink: 0 }}>
                  <div style={{ background: `conic-gradient(${gradientStops})`, borderRadius: '50%', width: '100%', height: '100%' }}></div>
                  <div style={{ position: 'absolute', top: '32px', left: '32px', width: '91px', height: '91px', backgroundColor: '#0f172a', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Total</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>₹{totalSpend.toFixed(0)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '130px', maxHeight: '160px', overflowY: 'auto' }}>
                  {Object.entries(categoryTotals).map(([cat, amt], idx) => {
                    const pct = ((amt / totalSpend) * 100).toFixed(1);
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '9px', height: '9px', backgroundColor: colors[idx % colors.length], borderRadius: '3px' }}></span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{cat}</span>
                        </div>
                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Bar Chart Card */}
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Monthly Trend</h3>
            {sortedMonths.length === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.875rem' }}>No trend data found</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '175px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem', gap: '0.75rem' }}>
                {sortedMonths.map(month => {
                  const amt = monthlyTotals[month];
                  const heightPercent = Math.max((amt / maxMonthlyAmount) * 100, 12);
                  return (
                    <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>₹{amt}</span>
                      <div title={`${month}: ₹${amt}`} style={{ width: '85%', maxWidth: '36px', background: 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)', borderRadius: '6px 6px 0 0', height: `${heightPercent}%`, transition: 'height 0.4s ease', boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)' }}></div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>{month.split('-')[1]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Filters & Table Card */}
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>

          <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.4)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.875rem', outline: 'none', flex: 1, minWidth: '160px', backgroundColor: '#0f172a', color: '#fff' }}
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.875rem', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontWeight: 500 }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.875rem', backgroundColor: '#0f172a', color: '#fff', outline: 'none', fontWeight: 500 }}
              >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="LAST_QUARTER">Last Quarter</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort:</span>
              <button onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ background: sortBy === 'date' ? 'rgba(129, 140, 248, 0.2)' : '#0f172a', color: sortBy === 'date' ? '#818cf8' : '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Date {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ background: sortBy === 'amount' ? 'rgba(129, 140, 248, 0.2)' : '#0f172a', color: sortBy === 'amount' ? '#818cf8' : '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.5rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Amount {sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.075em' }}>
                  <th style={{ padding: '1rem 1.75rem' }}>Date</th>
                  <th style={{ padding: '1.75rem' }}>Title</th>
                  <th style={{ padding: '1rem 1.75rem' }}>Category</th>
                  <th style={{ padding: '1rem 1.75rem' }}>Amount</th>
                  <th style={{ padding: '1rem 1.75rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background-color 0.15s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.1rem 1.75rem', color: '#94a3b8', fontWeight: 500 }}>{exp.expenseDate}</td>
                    <td style={{ padding: '1.1rem 1.75rem', fontWeight: 700, color: '#f8fafc' }}>{exp.title}</td>
                    <td style={{ padding: '1.1rem 1.75rem' }}>
                      <span style={{ backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', border: '1px solid rgba(129, 140, 248, 0.3)' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1.75rem', fontWeight: 800, color: '#f8fafc' }}>₹{exp.amount.toFixed(2)}</td>
                    <td style={{ padding: '1.1rem 1.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.45rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      No transaction records matched your parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};