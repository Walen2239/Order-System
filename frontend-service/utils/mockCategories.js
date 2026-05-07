// Mock categories with items and sauce requirements
export const mockCategories = [
  {
    id: 1,
    name: 'Mains',
    items: [
      { id: 1, name: 'Fish', requiresSauces: true },
      { id: 2, name: 'Chicken', requiresSauces: true },
      { id: 3, name: 'Beef Steak', requiresSauces: true },
    ],
  },
  {
    id: 2,
    name: 'Sides',
    items: [
      { id: 4, name: 'Fries', requiresSauces: false },
      { id: 5, name: 'Salad', requiresSauces: true },
      { id: 6, name: 'Rice', requiresSauces: false },
    ],
  },
  {
    id: 3,
    name: 'Beverages',
    items: [
      { id: 7, name: 'Coke', requiresSauces: false },
      { id: 8, name: 'Water', requiresSauces: false },
      { id: 9, name: 'Juice', requiresSauces: false },
    ],
  },
];

export const mockSauces = ['Grilled', 'Fried', 'BBQ', 'Mayo', 'Ketchup', 'Mustard', 'Oregano'];
