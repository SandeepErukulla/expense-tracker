export default function Sidebar() {
  return (
    <aside style={{ width: '220px', background: '#0f172a', color: '#94a3b8', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>Menu</div>
      <div style={{ color: '#38bdf8', cursor: 'pointer' }}>Dashboard</div>
      <div style={{ cursor: 'pointer' }}>Transactions</div>
      <div style={{ cursor: 'pointer' }}>Categories</div>
      <div style={{ cursor: 'pointer' }}>Settings</div>
    </aside>
  );
}