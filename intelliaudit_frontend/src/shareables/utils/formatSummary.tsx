import React from 'react';

export function renderExecutiveSummary(raw: string | undefined): React.ReactNode {
  if (!raw) return <p className="text-muted-foreground">No executive summary available.</p>;

  // Try JSON parse first
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      // recursive search for field containing 'summary'
      const findSummary = (o: any): string | null => {
        if (!o || typeof o !== 'object') return null;
        for (const [k, v] of Object.entries(o)) {
          if (k.toLowerCase().includes('summary') && typeof v === 'string') {
            return v;
          }
          if (typeof v === 'object') {
            const nested = findSummary(v);
            if (nested) return nested;
          }
        }
        return null;
      };
      const summaryText = findSummary(obj);
      if (summaryText) {
        return <p className="whitespace-pre-wrap text-sm">{summaryText}</p>;
      }
      // fallback: treat as too verbose; show generic msg
      return <p className="text-sm text-muted-foreground">Summary embedded in form; not available for preview.</p>;
    }
  } catch (_e) {
    /* not JSON */
  }

  // If string contains \n use paragraphs
  if (raw.includes('\n')) {
    return raw.split(/\n+/).map((para, idx) => (
      <p key={idx} className="text-sm mb-2 last:mb-0">
        {para}
      </p>
    ));
  }

  if (/^[\[{]/.test(raw.trim()) && raw.length > 300) {
    return (
      <p className="text-sm text-muted-foreground">
        Executive summary not provided in readable format.
      </p>
    );
  }

  return <p className="text-sm whitespace-pre-wrap">{raw}</p>;
} 