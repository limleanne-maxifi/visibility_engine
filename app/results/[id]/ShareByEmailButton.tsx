'use client';

import { useState } from 'react';

interface Props {
  defaultEmail: string;
  firstName: string;
  company: string;
}

export default function ShareByEmailButton({ defaultEmail, firstName, company }: Props) {
  const [email, setEmail]   = useState(defaultEmail);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sentTo, setSentTo] = useState('');

  const send = async () => {
    if (!email.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/share-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          snapshotUrl: window.location.href,
          firstName,
          company,
        }),
      });
      if (!res.ok) throw new Error();
      setSentTo(email.trim());
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Sent to <strong>{sentTo}</strong></span>
        </div>
        <button
          onClick={() => { setStatus('idle'); setEmail(''); }}
          className="text-xs text-[#534AB7] hover:underline"
        >
          Send to another address →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Email address"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7] transition-colors"
        />
        <button
          onClick={send}
          disabled={status === 'sending' || !email.trim()}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-[#534AB7] hover:bg-[#4640a0] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          {status === 'sending' ? (
            <>
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Sending…
            </>
          ) : 'Send →'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">Something went wrong — please try again.</p>
      )}
    </div>
  );
}
