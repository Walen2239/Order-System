import { useState, useRef, useEffect } from 'react';
import Countdown from '../components/Countdown';
import Nav from '../components/Nav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Home() {
  const [orders, setOrders] = useState([]);
  const [orderColors, setOrderColors] = useState({});
  const contentRef = useRef(null);
  const scrollbarRef = useRef(null);

  const handleToneChange = (orderId, tone) => {
    setOrderColors(prev => ({
      ...prev,
      [orderId]: tone === 'darkgreen' ? 'white' : tone,
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
        const res = await fetch(`${API_BASE}/api/orders/?includeToggles=1`);
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
        <h1>Kitchen - Order Queue</h1>
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
                  // show white background for no-tone or green tone, colored background for orange/red
                  backgroundColor: (orderColors[order.id] === 'green' || orderColors[order.id] === 'white' || !orderColors[order.id]) ? '#fff' : orderColors[order.id],
                  // text color: green/white tone -> black text, colored backgrounds -> white text, no-tone -> black text
                  color: orderColors[order.id] ? (orderColors[order.id] === 'green' || orderColors[order.id] === 'white' ? '#000' : '#fff') : '#000',
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
                    const isToggled = order.toggledItems && order.toggledItems[String(idx)];
                    return (
                      <p
                        key={idx}
                        style={{
                          cursor: 'default',
                          color: isToggled ? '#999' : '#000',
                          textDecoration: isToggled ? 'line-through' : 'none',
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
                    );
                  })}
                </div>
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

