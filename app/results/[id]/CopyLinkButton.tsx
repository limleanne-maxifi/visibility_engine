'use client';

import { useState } from 'react';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      prompt('Copy this link to share your plan:', window.location.href);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-1 py-3 px-5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors"
    >
      {copied ? '✓ Link copied!' : 'Copy link to share this plan'}
    </button>
  );
}
