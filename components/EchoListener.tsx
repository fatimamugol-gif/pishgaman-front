'use client';

import React, { useState } from 'react';
import IncomingCallAlert from './IncomingCallAlert';
import CallOutcomeModal from './CallOutcomeModal';

export default function EchoListener() {
  const [incomingCall, setIncomingCall] = useState<any>(null); // وضعیت فعال شدن زنگ
  const [showOutcomeModal, setShowOutcomeModal] = useState(false); // وضعیت باز شدن فرم یادداشت
  

  // شبیه‌ساز شلیک رویداد از سمت آستریسک/وب‌سوکت
  // در کد واقعی این کانتکست داخل .listen رویداد لاراول اکو قرار می‌گیرد
  const handleIncomingCallEvent = (data: any) => {
    setIncomingCall({
      phone: data.phone || '09123456789',
      lead: data.lead || { id: 1, name: 'امیرحسین سالار', phone: '09123456789' },
      taskId: data.task_id || 101
    });
  };

  return (
    <>
      {/* ۱. ابتدا پاپ‌آپ سمت راست ظاهر می‌شود، می‌لرزد و زنگ می‌خورد */}
      {incomingCall && (
        <IncomingCallAlert 
          callerName={incomingCall.lead.name}
          callerNumber={incomingCall.phone}
          onAccept={() => {
            setIncomingCall(null); // زنگ و لرزش قطع می‌شود
            setShowOutcomeModal(true); // فرم ۳۶۰ درجه وسط صفحه باز می‌شود
          }}
          onDecline={() => setIncomingCall(null)}
        />
      )}

      {/* ۲. پس از تایید کارشناس، فرم وضعیت‌سنجی متصل به لاراول باز می‌شود */}
      {showOutcomeModal && (
        <CallOutcomeModal 
          lead={incomingCall?.lead || { id: 1, name: 'امیرحسین سالار', phone: '09123456789' }}
          taskId={incomingCall?.taskId || 101}
          onClose={() => setShowOutcomeModal(false)}
          onSuccess={() => console.log('تسک در سیستم هوشمند بسته شد')}
        />
      )}
    </>
  );
}