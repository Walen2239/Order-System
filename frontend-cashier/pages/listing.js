import { useEffect, useState } from 'react';
import Nav from '../components/Nav';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export default function Listing() {
  const [categories, setCategories] = useState([]);
  const [listingItems, setListingItems] = useState([]);
  const [activeTab, setActiveTab] = useState('goods');
  const [selectedCategoryMenu, setSelectedCategoryMenu] = useState('');
  

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryAllowSauce, setNewCategoryAllowSauce] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('item');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');

  const createCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    try {
      const res = await fetch(`${API_BASE}/api/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            kind: 'goods',
            allowSauce: newCategoryAllowSauce,
          }),
      });
      const cat = await res.json();
      setCategories(prev => {
        const exists = prev.some(c => c.id === cat.id);
        return exists ? prev : [...prev, cat];
      });
      setNewCategory('');
      setNewCategoryAllowSauce(false);
      setActiveTab('goods');
    } catch (e) {
      // ignore
    }
  };

  const deleteCategory = async (id) => {
    try {
      await fetch(`${API_BASE}/api/categories/${id}/`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      setListingItems(prev => prev.filter(i => i.categoryId !== id));
    } catch (e) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setListingItems(prev => prev.filter(i => i.categoryId !== id));
    }
  };

  const createListingItem = async () => {
    const name = newItemName.trim();
    if (!name || !newItemCategoryId) return;

    try {
      const res = await fetch(`${API_BASE}/api/listing-items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          itemType: newItemType,
          categoryId: newItemCategoryId,
        }),
      });
      const item = await res.json();
      setListingItems(prev => [...prev, item]);
      setNewItemName('');
    } catch (e) {
      // ignore
    }
  };

  const deleteListingItem = async (id) => {
    try {
      await fetch(`${API_BASE}/api/listing-items/${id}/`, { method: 'DELETE' });
      setListingItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      setListingItems(prev => prev.filter(i => i.id !== id));
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [catsRes, listingRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories/`),
          fetch(`${API_BASE}/api/listing-items/`),
        ]);
        if (!mounted) return;
        const cats = await catsRes.json();
        const items = await listingRes.json();
        setCategories(cats);

        if (!newItemCategoryId && Array.isArray(cats) && cats.length > 0) {
          setNewItemCategoryId(cats[0].id);
        }

        setListingItems(items);
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
    const iv = setInterval(fetchAll, 2000);
    return () => { mounted = false; clearInterval(iv); };
  }, [newItemCategoryId]);

  const displayedCategories = categories.filter(c => c.kind === 'goods' || c.kind === 'sauces');
  const itemCategories = categories.filter(c => c.kind === 'goods' || c.kind === 'sauces');
  const filteredItems = listingItems.filter(i => (activeTab === 'goods' ? i.itemType === 'item' : i.itemType === 'sauce') && (!selectedCategoryMenu || i.categoryId === selectedCategoryMenu));

  return (
    <div>
      <Nav />
      <div style={{ padding: 20 }}>
        <h1>Listing</h1>

        <div style={{ border: '1px solid #111', padding: 12, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Add Item To Listing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 8 }}>
            <input
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <select
              value={newItemType}
              onChange={(e) => {
                const nextType = e.target.value;
                setNewItemType(nextType);
                const matching = categories.find(c => nextType === 'item' ? c.kind === 'goods' : c.kind === 'sauces');
                setNewItemCategoryId(matching ? matching.id : '');
              }}
            >
              <option value="item">Items</option>
              <option value="sauce">Sauces</option>
            </select>
            <select value={newItemCategoryId} onChange={(e) => setNewItemCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {itemCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={createListingItem}>Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, border: '1px solid #111', padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>Create Category</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
              <input
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              {/* kind selector removed - defaulting to 'goods' */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={newCategoryAllowSauce}
                  onChange={(e) => setNewCategoryAllowSauce(e.target.checked)}
                />
                Toggle sauces
              </label>
              <button onClick={createCategory}>Create</button>
            </div>

            <div style={{ display: 'flex', marginTop: 12, marginBottom: 10 }}>
              <button
                onClick={() => setActiveTab('goods')}
                style={{ flex: 1, background: activeTab === 'goods' ? '#111' : '#fff', color: activeTab === 'goods' ? '#fff' : '#111' }}
              >
                Goods
              </button>
              <button
                onClick={() => setActiveTab('sauces')}
                style={{ flex: 1, background: activeTab === 'sauces' ? '#111' : '#fff', color: activeTab === 'sauces' ? '#fff' : '#111' }}
              >
                Sauces
              </button>
            </div>

            <ul>
              {displayedCategories.map(c => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    onClick={() => setSelectedCategoryMenu(prev => (prev === c.id ? '' : c.id))}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    {c.name}{c.allowSauce ? ' (sauces)' : ''}
                  </span>
                  <button onClick={() => deleteCategory(c.id)}>Remove</button>
                </li>
              ))}
            </ul>

            
          </div>

          <div style={{ flex: 2, border: '1px solid #111', padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>{activeTab === 'goods' ? 'Items' : 'Sauces'} In Listing</h2>
            {filteredItems.map(i => (
              <div key={i.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{i.name}</div>
                <div>Category: {i.categoryName}</div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => deleteListingItem(i.id)}>Remove</button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <p>No {activeTab === 'goods' ? 'items' : 'sauces'} in this tab.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
