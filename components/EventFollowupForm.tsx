'use client';

import { useState } from 'react';

interface Props {
  leadId: string;
  entityName: string;
  onSubmitSuccess?: () => void;
}

export default function EventFollowupForm({ leadId, entityName, onSubmitSuccess }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/event-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          name: name.trim(),
          email: email.trim(),
          query: query.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit');
      }

      setSubmitSuccess(true);
      setName('');
      setEmail('');
      setQuery('');
      onSubmitSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center">
        <p className="text-sm font-semibold text-emerald-900 mb-1">Thanks for signing up</p>
        <p className="text-xs text-emerald-700">We'll follow up with you after the event.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C87A2F] transition-colors"
        />
      </div>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C87A2F] transition-colors"
        />
      </div>

      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Specific query you want to own (optional)"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C87A2F] transition-colors"
        />
      </div>

      {submitError && (
        <p className="text-xs text-red-600">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-center text-sm font-semibold text-white bg-[#C87A2F] hover:bg-[#A8651E] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2.5 transition-colors"
      >
        {isSubmitting ? 'Submitting…' : 'I'm interested →'}
      </button>
    </form>
  );
}
