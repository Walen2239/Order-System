import { useState, useRef, useEffect } from 'react';
import Countdown from '../components/Countdown';
import Nav from '../components/Nav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Home() {
  const [orders, setOrders] = useState([]);
  const [toggledItems, setToggledItems] = useState({});
  const [orderColors, setOrderColors] = useState({});
  const contentRef = useRef(null);
  const scrollbarRef = useRef(null);

  const handleToggleItem = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    // update local UI state
    setToggledItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));

    // also send toggle to backend so kitchen can sync
    // fetch existing toggled map for this order from local state (derive)
    try {
      const newMap = {};
      // build mapping from current toggledItems for this order
      // we expect keys like `${orderId}-${idx}`
      Object.keys(toggledItems).forEach(k => {
        if (k.startsWith(`${orderId}-`)) {
          const idx = k.split('-')[1];
          newMap[idx] = !!toggledItems[k];
        }
      });
      // flip the clicked one
      newMap[String(itemIndex)] = !newMap[String(itemIndex)];

      fetch(`${API_BASE}/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggledItems: newMap }),
      }).catch(() => {
        // ignore errors; UI remains optimistic
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDone = (id) => {
    // mark done on server, then remove locally
    fetch(`${API_BASE}/api/orders/${id}/`, { method: 'DELETE' }).then(() => {
      setOrders(orders.filter(order => order.id !== id));
    }).catch(() => setOrders(orders.filter(order => order.id !== id)));
  };

  const handleToneChange = (orderId, tone) => {
    setOrderColors(prev => ({
      ...prev,
      [orderId]: tone,
    }));
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

  const getWarningLabel = (tone) => {
    if (tone === 'red') {
      return 'LATE LATE LATE';
    }
    if (tone === 'orange') {
      return 'OVERDUE';
    }
    return '';
  };

  useEffect(() => {
    if (contentRef.current && scrollbarRef.current?.firstChild) {
      scrollbarRef.current.firstChild.style.width = contentRef.current.scrollWidth + 'px';
    }
  }, [orders]);

  // poll orders from API
  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/`);
        if (!mounted) return;
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        // ignore
      }
    };
    fetchOrders();
    const iv = setInterval(fetchOrders, 2000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

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
        <h1>Service - Orders</h1>

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
                border: '1px solid #111',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                minWidth: '300px',
                flex: '0 0 300px',
                position: 'relative',
                textAlign: 'center',
                backgroundColor: '#fff',
              }}
            >
              <div
                style={{
                  height: '34px',
                  overflow: 'hidden',
                  // white background for darkgreen/green/no-tone; colored background for orange/red
                  backgroundColor: (orderColors[order.id] === 'green' || orderColors[order.id] === 'darkgreen' || !orderColors[order.id]) ? '#fff' : orderColors[order.id],
                  // text color: green/darkgreen tones use their color for text, colored backgrounds use white text, no-tone uses black
                  color: orderColors[order.id] ? (orderColors[order.id] === 'green' ? 'green' : (orderColors[order.id] === 'darkgreen' ? 'darkgreen' : '#fff')) : '#000',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {getWarningLabel(orderColors[order.id]) ? (
                  <div
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      paddingLeft: '100%',
                      animation: 'service-marquee 6s linear infinite',
                    }}
                  >
                    {`${getWarningLabel(orderColors[order.id])}     ${getWarningLabel(orderColors[order.id])}     ${getWarningLabel(orderColors[order.id])}     ${getWarningLabel(orderColors[order.id])}`}
                  </div>
                ) : (
                  <div style={{ width: '100%' }} />
                )}
              </div>
              <div style={{ padding: '14px 16px 18px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '800' }}>{order.orderNumber}</p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1.05' }}>
                    Table: {order.table}
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <Countdown createdAt={order.createdAt} onToneChange={(tone) => handleToneChange(order.id, tone)} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  {order.items.map((item, idx) => {
                    const isToggled = toggledItems[`${order.id}-${idx}`];
                    return (
                      <p
                        key={idx}
                        onClick={() => handleToggleItem(order.id, idx)}
                        style={{
                          cursor: 'pointer',
                          textDecoration: isToggled ? 'line-through' : 'none',
                          color: isToggled ? '#999' : '#000',
                          margin: '8px 0',
                          padding: '2px 0',
                          fontSize: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {formatOrderItem(item)}
                      </p>
                    );
                  })}
                </div>
                <button onClick={() => handleDone(order.id)} style={{ padding: '6px 14px', cursor: 'pointer' }}>Done</button>
              </div>
            </div>
          ))}
        </div>
        {orders.length === 0 && <p>No pending orders</p>}
      </div>
      <style jsx>{`
        @keyframes service-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
