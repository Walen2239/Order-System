export function getNextTableNumber() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const stored = localStorage.getItem('tableNumberData');
  
  let data = stored ? JSON.parse(stored) : { date: today, count: 0 };
  
  // Reset if date has changed
  if (data.date !== today) {
    data = { date: today, count: 0 };
  }
  
  // Increment counter
  data.count += 1;
  localStorage.setItem('tableNumberData', JSON.stringify(data));
  
  return `T${String(data.count).padStart(3, '0')}`;
}
