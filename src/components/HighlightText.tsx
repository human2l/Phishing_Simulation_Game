import { AlertTriangle } from 'lucide-react';
import React from 'react';

export interface HighlightTerm {
  term: string;
  clueText: string;
}

export function getHighlightsFromClues(textToSearch: string, clues: string[]): HighlightTerm[] {
  const highlightMap = new Map<string, string>();
  
  clues.forEach(clue => {
    // Match quoted strings
    const quotes = clue.match(/['"](.*?)['"]/g);
    if (quotes) {
      quotes.forEach(q => {
        const term = q.slice(1, -1);
        if (term.length > 3 && textToSearch.includes(term)) {
          if (!highlightMap.has(term)) highlightMap.set(term, clue);
        }
      });
    }

    // Match URLs
    const urls = clue.match(/https?:\/\/[^\s'"]+/g);
    if (urls) {
      urls.forEach(u => {
        const term = u.replace(/[.,;)]$/, '');
        if (textToSearch.includes(term)) {
          if (!highlightMap.has(term)) highlightMap.set(term, clue);
        }
      });
    }
    
    // Match emails
    const emails = clue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) {
      emails.forEach(e => {
        if (textToSearch.includes(e)) {
          if (!highlightMap.has(e)) highlightMap.set(e, clue);
        }
      });
    }
  });
  
  return Array.from(highlightMap.entries())
    .map(([term, clueText]) => ({ term, clueText }))
    .sort((a, b) => b.term.length - a.term.length);
}

export function HighlightedText({ text, terms }: { text: string; terms: HighlightTerm[] }) {
  if (!terms || !terms.length || !text) return <>{text}</>;

  const termStrs = terms.map(t => t.term);
  const escapedTerms = termStrs.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'g');

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const termObj = terms.find(t => t.term === part);
        if (termObj) {
          return (
            <span key={i} className="relative group inline-block bg-red-200 text-red-900 border-b-2 border-red-500 font-bold px-1 rounded-sm mx-[1px] cursor-help">
              {part}
              {/* Tooltip Overlay */}
              <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-white border-2 border-red-200 rounded-xl shadow-2xl z-50 normal-case font-normal pointer-events-none origin-top text-left leading-normal">
                <span className="flex items-center gap-1.5 text-red-700 font-bold text-xs uppercase tracking-wider border-b border-red-100 pb-2 mb-2">
                   <AlertTriangle size={14} /> Clue Explanation
                </span>
                <span className="text-[13px] text-gray-700 leading-snug block">
                  {termObj.clueText}
                </span>
                {/* Carrot/Arrow */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-red-200"></span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-white mb-[-2px]"></span>
              </span>
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
