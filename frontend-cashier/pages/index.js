import { useState, useRef, useEffect } from 'react';
import Nav from '../components/Nav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Home() {
  const [orders, setOrders] = useState([]);
  const [orderColors, setOrderColors] = useState({});
  const [checkedOrders, setCheckedOrders] = useState({});
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const contentRef = useRef(null);
  const scrollbarRef = useRef(null);

  const handleCheck = (id) => {
    // toggle local-only checked state for cashier
    setCheckedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDone = (id) => {
    // used by service; cashier will reflect removals via polling
    fetch(`${API_BASE}/api/orders/${id}/`, { method: 'DELETE' }).then(() => {
      setOrders(orders.filter(order => order.id !== id));
      // ensure local check state cleared
      setCheckedOrders(prev => { const n = { ...prev }; delete n[id]; return n; });
    }).catch(() => setOrders(orders.filter(order => order.id !== id)));
  };

  const handleToneChange = (orderId, tone) => {
    setOrderColors(prev => ({
      ...prev,
      [orderId]: tone,
    }));
  };

  // API: fetch categories and orders
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [catsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories/`),
          fetch(`${API_BASE}/api/orders/`),
        ]);
        if (!mounted) return;
        const cats = await catsRes.json();
        const ords = await ordersRes.json();
        setCategories(cats);
        setOrders(ords);
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
    const iv = setInterval(fetchAll, 2000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const createCategory = async () => {
    if (!newCategory) return;
    try {
      const res = await fetch(`${API_BASE}/api/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory }),
      });
      const cat = await res.json();
      setCategories(prev => [...prev, cat]);
      setNewCategory('');
    } catch (e) {
      // ignore
    }
  };

  const createOrderFromCategory = async () => {
    if (!selectedCategory) return;
    const cat = categories.find(c => c.id === Number(selectedCategory) || c.id === selectedCategory);
    const items = cat ? [cat.name] : [selectedCategory];
    try {
      const res = await fetch(`${API_BASE}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: '', items }),
      });
      const order = await res.json();
      setOrders(prev => [...prev, order]);
    } catch (e) {
      // ignore
    }
  };

  const handleContentScroll = () => {
    if (contentRef.current && scrollbarRef.current) {
      scrollbarRef.current.scrollLeft = contentRef.current.scrollLeft;
    }
  };

  const handleScrollbarScroll = () => {
    if (contentRef.current && scrollbarRef.current) {
      contentRef.current.scrollLeft = scrollbarRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (contentRef.current && scrollbarRef.current?.firstChild) {
      scrollbarRef.current.firstChild.style.width = contentRef.current.scrollWidth + 'px';
    }
  }, [orders]);

  const formatOrderItem = (item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item.display || JSON.stringify(item);
    }
    return String(item);
  };

  return (
    <div>
      <Nav />
      <div style={{ padding: '20px' }}>
        <h1>Cashier - Items</h1>
        <div
          ref={scrollbarRef}
          onScroll={handleScrollbarScroll}
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            height: '20px',
            marginBottom: '10px',
          }}
        >
          <div style={{ width: '100%', height: '1px' }} />
        </div>
        <div
          ref={contentRef}
          onScroll={handleContentScroll}
          style={{ display: 'flex', gap: '10px', overflowX: 'hidden', overflowY: 'hidden' }}>
          
          {orders.map(order => (
            <div
              key={order.id}
              style={{
                border: checkedOrders[order.id] ? '1px solid #888' : '1px solid #111',
                overflow: 'hidden',
                boxShadow: checkedOrders[order.id] ? '0 2px 10px rgba(0, 0, 0, 0.12)' : '0 2px 10px rgba(0, 0, 0, 0.06)',
                minWidth: '300px',
                flex: '0 0 300px',
                position: 'relative',
                textAlign: 'center',
                backgroundColor: checkedOrders[order.id] ? '#ececec' : '#fff',
                opacity: checkedOrders[order.id] ? 0.82 : 1,
              }}
            >
              <div style={{ padding: '14px 16px 18px' }}>
                <p style={{ margin: '35px 0 12px', fontSize: '18px', fontWeight: '800' }}>{order.orderNumber}</p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1.05' }}>
                    Table: {order.table}
                  </div>
                  
                </div>
                <div style={{ marginBottom: '14px' }}>
                  {order.items.map((item, idx) => (
                    <p
                      key={idx}
                      style={{
                        cursor: 'default',
                        color: '#000',
                        margin: '8px 0',
                        padding: '2px 0',
                        fontSize: '18px',
                        textAlign: 'center',
                        fontWeight: '400',
                        lineHeight: '1.2',
                      }}
                    >
                      {formatOrderItem(item)}
                    </p>
                  ))}
                </div>
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => handleCheck(order.id)}>{checkedOrders[order.id] ? 'Unchecked' : 'Check'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {orders.length === 0 && <p>No pending orders</p>}
      </div>
    </div>
  );
}
