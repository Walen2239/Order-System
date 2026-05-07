import { useState, useEffect } from 'react';

export default function Countdown({ createdAt, onToneChange }) {
  const [timeLeft, setTimeLeft] = useState('NA:NA');
  const [color, setColor] = useState('black');

  useEffect(() => {
    if (!createdAt) {
      setTimeLeft('NA:NA');
      return;
    }

    let createdDate;
    if (typeof createdAt === 'string') {
      createdDate = new Date(createdAt);
    } else if (createdAt instanceof Date) {
      createdDate = createdAt;
    } else {
      setTimeLeft('NA:NA');
      return;
    }
    
    if (isNaN(createdDate.getTime())) {
      console.warn('Invalid createdAt:', createdAt);
      setTimeLeft('NA:NA');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const elapsedMs = now - createdDate;
      const diff = 20 * 60 * 1000 - elapsedMs;

      const remainingMs = Math.max(diff, 0);
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;

      let nextColor = 'darkgreen';

      if (diff > 15 * 60 * 1000) {
        nextColor = 'darkgreen';
      } else if (diff > 10 * 60 * 1000) {
        nextColor = 'green';
      } else if (diff > 5 * 60 * 1000) {
        nextColor = 'orange';
      } else {
        nextColor = 'red';
      }

      setColor(nextColor);
      if (onToneChange) {
        onToneChange(nextColor);
      }

      setTimeLeft(displayTime);
    };

    // Call immediately to show initial time
    updateTimer();

    // Then set up interval for updates
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onToneChange]);

  return (
    <div style={{ color, fontWeight: '900', fontSize: '56px', lineHeight: '1', textAlign: 'center' }}>{timeLeft}</div>
  );
}
