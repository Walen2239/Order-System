export default function Nav() {
  const goToHome = () => window.location.assign('/');
  const goToOrders = () => window.location.assign('/orders');
  
  return (
    <nav style={{ display: 'flex', justifyContent: 'flex-start', gap: '20px', padding: '15px 20px', borderBottom: '1px solid #eee' }}>
      <button
        type="button"
        onClick={goToHome}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          fontWeight: 'bold',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        Home
      </button>
      <button
        type="button"
        onClick={goToOrders}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          fontWeight: 'bold',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        Orders
      </button>
    </nav>
  );
}
