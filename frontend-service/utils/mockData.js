// Mock data for orders
export const mockOrders = [
  {
    id: 1,
    orderNumber: '#001',
    items: ['Burger - Ketchup', 'Fries - Mayo'],
    table: 'T5',
    createdAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
    completed: false,
  },
  {
    id: 2,
    orderNumber: '#002',
    items: ['Pizza - Oregano', 'Coke'],
    table: 'T3',
    createdAt: new Date(Date.now() - 12 * 60000), // 12 mins ago
    completed: false,
  },
  {
    id: 3,
    orderNumber: '#003',
    items: ['Salad - Grilled', 'Water'],
    table: 'T7',
    createdAt: new Date(Date.now() - 2 * 60000), // 2 mins ago
    completed: false,
  },
    {
    id: 1,
    orderNumber: '#001',
    items: ['Burger - Ketchup', 'Fries - Mayo'],
    table: 'T5',
    createdAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
    completed: false,
  },
  {
    id: 2,
    orderNumber: '#002',
    items: ['Pizza - Oregano', 'Coke'],
    table: 'T3',
    createdAt: new Date(Date.now() - 12 * 60000), // 12 mins ago
    completed: false,
  },
  {
    id: 3,
    orderNumber: '#003',
    items: ['Salad - Grilled', 'Water'],
    table: 'T7',
    createdAt: new Date(Date.now() - 2 * 60000), // 2 mins ago
    completed: false,
  },
];
