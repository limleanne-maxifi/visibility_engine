'use client';

import { useState } from 'react';

interface Props {
  leadId: string;
  platform: string;
  expectedResult: string;
}

export default function DiscrepancyButton({ leadId, platform, expectedResult }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [actualResult, setActualResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!actualResult.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, platform, expectedResult, actualResult }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Fail silently — not critical
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <span className="text-xs text-emerald-600 font-medium">Thanks — noted ✓</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline transition-colors"
      >
        Doesn&rsquo;t match what you see?
      </button>
    );
  }

  return (
    <div className="w-full mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-600 mb-1.5 font-medium">What did you actually see?</p>
      <textarea
        rows={2}
        value={actualResult}
        onChange={(e) => setActualResult(e.target.value)}
        placeholder="e.g. I appeared accurately, or a different competitor showed up"
        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#534AB7] resize-none text-gray-700 bg-white"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSubmit}
          disabled={!actualResult.trim() || isSubmitting}
          className="text-xs font-semibold text-white bg-[#534AB7] hover:bg-[#4640a0] px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Sending…' : 'Send feedback'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
