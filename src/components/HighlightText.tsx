import React from 'react';

export function getHighlightsFromClues(textToSearch: string, clues: string[]) {
  const terms: string[] = [];
  
  clues.forEach(clue => {
    // Match quoted strings
    const quotes = clue.match(/['"](.*?)['"]/g);
    if (quotes) {
      quotes.forEach(q => {
        const term = q.slice(1, -1);
        if (term.length > 3 && textToSearch.includes(term)) {
          terms.push(term);
        }
      });
    }

    // Match URLs
    const urls = clue.match(/https?:\/\/[^\s'"]+/g);
    if (urls) {
      urls.forEach(u => {
        const term = u.replace(/[.,;)]$/, '');
        if (textToSearch.includes(term)) {
          terms.push(term);
        }
      });
    }
    
    // Match emails
    const emails = clue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) {
      emails.forEach(e => {
        if (textToSearch.includes(e)) {
          terms.push(e);
        }
      });
    }
  });
  
  return Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
}

export function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!terms || !terms.length || !text) return <>{text}</>;

  const escapedTerms = terms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'g');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (terms.includes(part)) {
          return (
            <span key={i} className="bg-red-200 text-red-900 border-b-2 border-red-500 font-bold px-1 rounded-sm mx-[1px]">
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
