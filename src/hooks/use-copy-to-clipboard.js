'use client';

import { useState } from 'react';

export function useCopyToClipboard({ timeout = 2000, onCopy } = {}) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (value) => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      return;
    }

    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);

      if (onCopy) {
        onCopy();
      }

      if (timeout !== 0) {
        setTimeout(() => {
          setIsCopied(false);
        }, timeout);
      }
    }, console.error);
  };

  return { isCopied, copyToClipboard };
}
