import { useState, useEffect } from 'react';
import Nav from '../components/Nav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Orders() {
  const [categories, setCategories] = useState([]);
  const [listingItems, setListingItems] = useState([]);

  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedSauceId, setSelectedSauceId] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const goodsCategories = categories.filter(c => c.kind === 'goods');
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const itemOptions = listingItems.filter(i => i.itemType === 'item' && i.categoryId === selectedCategoryId);
  const sauceOptions = listingItems.filter(i => i.itemType === 'sauce');

  const addDraftItem = () => {
    const item = listingItems.find(i => i.id === selectedItemId);
    if (!item || selectedQty < 1) return;

    const sauce = listingItems.find(i => i.id === selectedSauceId);
    const display = `${selectedQty}x ${item.name}${sauce ? ` + ${sauce.name}` : ''}`;
    setDraftItems(prev => [...prev, display]);
    setSelectedQty(1);
    setSelectedSauceId('');
  };

  const removeDraftItem = (index) => {
    setDraftItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const createOrder = async () => {
    if (!tableNumber.trim() || draftItems.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableNumber.trim(), items: draftItems }),
      });
      const order = await res.json();
      setTableNumber('');
      setDraftItems([]);
      setSuccessMsg(`Order created for Table ${order.table} (${order.orderNumber})`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [categoriesRes, listingRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories/`),
          fetch(`${API_BASE}/api/listing-items/`),
        ]);
        if (!mounted) return;
        const [categoryData, listingData] = await Promise.all([
          categoriesRes.json(),
          listingRes.json(),
        ]);
        setCategories(categoryData);
        setListingItems(listingData);

        if (!selectedCategoryId && Array.isArray(categoryData)) {
          const firstGoods = categoryData.find(c => c.kind === 'goods');
          if (firstGoods) {
            setSelectedCategoryId(firstGoods.id);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedItemId('');
      return;
    }

    const firstItem = listingItems.find(i => i.itemType === 'item' && i.categoryId === selectedCategoryId);
    setSelectedItemId(firstItem ? firstItem.id : '');
    setSelectedSauceId('');
  }, [selectedCategoryId, listingItems]);

  return (
    <div>
      <Nav />
      <div style={{ padding: '20px' }}>
        <h1>Create Table Order</h1>

        {successMsg && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: 12, marginBottom: 14, borderRadius: 4 }}>
            {successMsg}
          </div>
        )}

        <div style={{ border: '1px solid #111', padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              <option value="">Select Goods Category</option>
              {goodsCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
              <option value="">Select Item</option>
              {itemOptions.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={selectedQty}
              onChange={(e) => setSelectedQty(Number(e.target.value || 1))}
            />
            <select
              value={selectedSauceId}
              onChange={(e) => setSelectedSauceId(e.target.value)}
              disabled={!selectedCategory?.allowSauce}
            >
              <option value="">No Sauce</option>
              {sauceOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button onClick={addDraftItem}>Add Item</button>
          </div>

          <div style={{ marginBottom: 12 }}>
            {draftItems.map((line, idx) => (
              <div key={`${line}-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '16px' }}>{line}</span>
                <button onClick={() => removeDraftItem(idx)}>Remove</button>
              </div>
            ))}
            {draftItems.length === 0 && <div style={{ color: '#666' }}>No items added yet.</div>}
          </div>

          <button onClick={createOrder} style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}>Submit Table Order</button>
        </div>
      </div>
    </div>
  );
}
