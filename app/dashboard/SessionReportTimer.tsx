import React, { useEffect, useState } from 'react';

interface TimerProps {
  deadlineAt: string; // رشته ISO زمان انقضا که از متد triggerSessionDeadline می‌آید
}

export const SessionReportTimer: React.FC<TimerProps> = ({ deadlineAt }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      const difference = new Date(deadlineAt).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft('🚨 مهلت قانونی گذشته؛ مکتوب کردن علت تاخیر الزامی است.');
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(`⏳ زمان باقی‌مانده جهت پلمب صورتجلسه: ${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  return (
    <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-sm text-center">
      {timeLeft}
    </div>
  );
};