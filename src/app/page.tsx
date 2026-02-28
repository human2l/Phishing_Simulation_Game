'use client';

import { EmailContent } from '@/components/EmailContent';
import { FinalScoreScreen } from '@/components/FinalScoreScreen';
import { getHighlightsFromClues, HighlightedText } from '@/components/HighlightText';

import { ScoreBoard } from '@/components/ScoreBoard';
import { GeneratedEmail } from '@/lib/ai';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagon, ArrowRight, CheckCircle2, CornerUpLeft, FileText, Inbox, Loader2, Mail, MoreHorizontal, Send, ShieldCheck, Siren, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_PRELOAD = 5;
const MAX_QUESTIONS = 10;
const POINTS_PER_QUESTION = 10;

export interface CardData extends GeneratedEmail {
  id: string;
  evaluated?: boolean;
}

async function fetchEmailPool(): Promise<GeneratedEmail[]> {
  const res = await fetch('/api/generate-email');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}



export default function MailClient() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [score, setScore] = useState({ tp: 0, tn: 0, fp: 0, fn: 0, total: 0 });
  const [feedbackState, setFeedbackState] = useState<'none' | 'success' | 'error'>('none');
  const [isGameOver, setIsGameOver] = useState(false);

  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalFetched = useRef(0);
  const cardCounter = useRef(0);
  const emailQueue = useRef<GeneratedEmail[]>([]);
  const hasBooted = useRef(false);

  const totalScore = (score.tp + score.tn) * POINTS_PER_QUESTION;

  // Auto-select first email when available if none selected
  useEffect(() => {
    if (cards.length > 0 && (!selectedId || !cards.find(c => c.id === selectedId))) {
      setSelectedId(cards[0].id);
    } else if (cards.length === 0) {
      setSelectedId(null);
    }
  }, [cards, selectedId]);



  useEffect(() => {
    if (hasBooted.current) return;
    hasBooted.current = true;
    
    let active = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const emails = await fetchEmailPool();
        if (!active) return;
        emailQueue.current = [...emails];
        const initial: CardData[] = [];
        
        for (let i = 0; i < MAX_PRELOAD && emailQueue.current.length > 0; i++) {
          const e = emailQueue.current.shift()!;
          initial.push({ ...e, id: `mail-${++cardCounter.current}` });
          totalFetched.current += 1;
        }
        setCards(initial);
      } catch (err) {
        console.error('[page.tsx] Failed to boot emails:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    boot();
    return () => {
      active = false;
    };
  }, []);

  // Manage auto-resetting the background flash after it plays
  useEffect(() => {
    if (feedbackState !== 'none') {
      autoCloseTimer.current = setTimeout(() => {
        setFeedbackState('none');
      }, 1000);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [feedbackState]);

  const handleAction = useCallback(
    (action: 'safe' | 'phish', cardId: string) => {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const isPhishing = card.isPhishing;
      const clues = card.clues;
      const isCorrect = 
        (action === 'phish' && isPhishing) || (action === 'safe' && !isPhishing);

      setScore((s) => {
        let tp = s.tp, tn = s.tn, fp = s.fp, fn = s.fn;
        if (action === 'phish' && isPhishing) tp++; // True Positive
        if (action === 'safe' && !isPhishing) tn++; // True Negative
        if (action === 'phish' && !isPhishing) fp++; // False Positive
        if (action === 'safe' && isPhishing) fn++; // False Negative
        return { tp, tn, fp, fn, total: s.total + 1 };
      });

      // Background flash instead of modal
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      setFeedbackState(isCorrect ? 'success' : 'error');

      // Mark as evaluated so UI updates to show clues/next button
      setCards((prev) => prev.map(c => c.id === cardId ? { ...c, evaluated: true } : c));
    },
    [cards]
  );

  const handleNext = useCallback(
    (cardId: string) => {
      // 1. Pop from queue safely OUTSIDE of the React state updater (fixes StrictMode double-shift bug)
      let newCard: CardData | null = null;
      if (emailQueue.current.length > 0) {
        const nextEmail = emailQueue.current.shift()!;
        totalFetched.current += 1;
        newCard = { ...nextEmail, id: `mail-${++cardCounter.current}` };
      }

      // 2. Update state purely
      setCards((prev) => {
        const newCards = prev.filter(c => c.id !== cardId);
        
        if (newCard) {
          newCards.push(newCard);
        }
        
        // If no more cards are left and queue is empty, End Game!
        if (newCards.length === 0 && emailQueue.current.length === 0) {
           setIsGameOver(true);
        }
        return newCards;
      });

      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      setFeedbackState('none');
    },
    []
  );
  
  const handleRestart = () => {
    setIsGameOver(false);
    setScore({ tp: 0, tn: 0, fp: 0, fn: 0, total: 0 });
    setCards([]);
    setSelectedId(null);
    cardCounter.current = 0;
    totalFetched.current = 0;
    emailQueue.current = [];
    
    // Boot up again
    setIsLoading(true);
    fetchEmailPool().then(emails => {
      emailQueue.current = [...emails];
      const initial: CardData[] = [];
      for (let i = 0; i < MAX_PRELOAD && emailQueue.current.length > 0; i++) {
        const e = emailQueue.current.shift()!;
        initial.push({ ...e, id: `mail-${++cardCounter.current}` });
        totalFetched.current += 1;
      }
      setCards(initial);
      setIsLoading(false);
    });
  };

  const selectedMail = cards.find((c) => c.id === selectedId);

  const showClues = !!selectedMail?.evaluated && selectedMail?.isPhishing;
  const combinedText = selectedMail ? `${selectedMail.subject || ''} ${selectedMail.senderEmail || ''} ${selectedMail.sender || ''} ${selectedMail.content || ''}` : '';
  const highlightTerms = useMemo(() => {
    if (!showClues || !selectedMail?.clues) return [];
    return getHighlightsFromClues(combinedText, selectedMail.clues);
  }, [showClues, combinedText, selectedMail?.clues]);

  const feedbackBgClass = feedbackState === 'success' ? 'bg-[#F0FDF4]' : feedbackState === 'error' ? 'bg-[#FEF2F2]' : 'bg-white';
  const rightColBgClass = cn("flex-1 flex flex-col overflow-hidden relative min-w-[500px] transition-colors duration-1000 ease-out", feedbackBgClass);
  const midColBgClass = cn("w-80 border-r border-[#E5E7EB] flex flex-col flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-1000 ease-out", feedbackBgClass);

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-[#1F2937] font-sans overflow-hidden">
      
      {/* ─── LEFT SIDEBAR (Navigation) ─── */}
      <aside className="w-64 bg-[#111827] text-[#D1D5DB] flex flex-col flex-shrink-0 relative">
        <div className="h-16 flex items-center px-6 border-b border-[#374151]">
          <ShieldCheck className="text-[#3B82F6] mr-3" size={24} />
          <h1 className="text-white font-bold text-lg tracking-wide">SecurMail Pro</h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Folders</div>
          
          <button className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1F2937] text-white rounded-lg">
            <div className="flex items-center gap-3">
              <Inbox size={18} className="text-[#3B82F6]" />
              <span className="font-medium text-sm">Inbox</span>
            </div>
            <span className="bg-[#3B82F6] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {cards.length}
            </span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1F2937] rounded-lg transition-colors group">
            <Send size={18} className="text-[#9CA3AF] group-hover:text-white" />
            <span className="font-medium text-sm group-hover:text-white">Sent Items</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1F2937] rounded-lg transition-colors group">
            <FileText size={18} className="text-[#9CA3AF] group-hover:text-white" />
            <span className="font-medium text-sm group-hover:text-white">Drafts</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1F2937] rounded-lg transition-colors group">
            <AlertOctagon size={18} className="text-[#9CA3AF] group-hover:text-white" />
            <span className="font-medium text-sm group-hover:text-white">Junk Email</span>
          </button>
        </nav>

        {/* Scoring / Lab Branding at bottom */}
        <div className="p-4 border-t border-[#374151]">
          <div className="bg-[#1F2937] p-4 rounded-xl">
            <div className="mb-4">
              <ScoreBoard 
                score={totalScore} 
                totalAnswered={score.total} 
                maxQuestions={MAX_QUESTIONS} 
              />
            </div>
            
            {/* Restored legacy 4-box scorecard stats */}
            <div className="text-xs font-bold text-[#9CA3AF] uppercase mb-3">Detailed Stats</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-center font-bold">
              <div className="bg-[#064E3B]/40 border border-[#064E3B] text-[#34D399] py-1.5 rounded-md flex flex-col items-center">
                <span className="opacity-70 text-[10px] mb-0.5">Intercepted (TP)</span> 
                <span className="text-base">{score.tp}</span>
              </div>
              <div className="bg-[#064E3B]/40 border border-[#064E3B] text-[#34D399] py-1.5 rounded-md flex flex-col items-center">
                <span className="opacity-70 text-[10px] mb-0.5">Cleared (TN)</span> 
                <span className="text-base">{score.tn}</span>
              </div>
              <div className="bg-[#7F1D1D]/40 border border-[#7F1D1D] text-[#FCA5A5] py-1.5 rounded-md flex flex-col items-center">
                <span className="opacity-70 text-[10px] mb-0.5">False Alert (FP)</span> 
                <span className="text-base">{score.fp}</span>
              </div>
              <div className="bg-[#7F1D1D]/40 border border-[#7F1D1D] text-[#FCA5A5] py-1.5 rounded-md flex flex-col items-center">
                <span className="opacity-70 text-[10px] mb-0.5">Missed (FN)</span> 
                <span className="text-base">{score.fn}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center gap-1 opacity-40">
             <span className="text-[10px] tracking-widest uppercase font-bold text-white">Bubu & Dudu</span>
             <span className="text-[10px] tracking-widest uppercase font-bold text-[#6B7280]">Security Lab</span>
          </div>
        </div>
      </aside>

      {/* ─── MIDDLE COLUMN (Mail List) ─── */}
      <div className={midColBgClass}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E7EB] bg-transparent">
          <h2 className="font-bold text-lg text-[#111827]">Inbox</h2>
          {isFetching && <Loader2 size={16} className="text-[#6B7280] animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-0 w-full overflow-hidden">
              {[1,2,3,4].map(i => (
                <div key={i} className="p-4 border-b border-[#F3F4F6] animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-[#E5E7EB] rounded w-24"></div>
                    <div className="h-3 bg-[#E5E7EB] rounded w-12"></div>
                  </div>
                  <div className="h-4 bg-[#E5E7EB] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#E5E7EB] rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : cards.length > 0 ? (
            <div className="flex flex-col w-full overflow-x-hidden">
              <AnimatePresence initial={false}>
                {cards.map(card => (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedId(card.id)}
                    className={cn(
                      "text-left p-4 border-b border-[#F3F4F6] transition-colors focus:outline-none relative w-full overflow-hidden",
                      selectedId === card.id ? "bg-[#EFF6FF] border-l-4 border-l-[#3B82F6]" : "hover:bg-[#F9FAFB] border-l-4 border-l-transparent",
                      card.evaluated && "opacity-60"
                    )}
                  >
                    <div className="flex justify-between items-baseline mb-1 w-full overflow-hidden">
                      <span className={cn("font-bold text-sm truncate pr-2 max-w-[70%]", selectedId === card.id ? "text-[#1E40AF]" : "text-[#1F2937]")}>{card.sender || 'Unknown Sender'}</span>
                      <span className="text-xs text-[#6B7280] flex-shrink-0">{card.time}</span>
                    </div>
                    <div className="font-semibold text-[13px] text-[#374151] mb-1 truncate w-full">{card.subject || 'No Subject'}</div>
                    <div className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed w-full">{card.content || ''}</div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#9CA3AF] p-6 text-center">
              <Inbox size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="font-medium text-sm text-[#4B5563]">Inbox is empty</p>
              <p className="text-xs mt-1">Waiting for new messages...</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT COLUMN (Mail Detail) ─── */}
      <div className={rightColBgClass}>
        {selectedMail ? (
          <>
            {/* Toolbar */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#E5E7EB] bg-transparent flex-shrink-0">
              <div className="flex gap-2">
                 <button className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-md transition" title="Reply">
                    <CornerUpLeft size={18} />
                 </button>
                 <button className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-md transition" title="Delete">
                    <Trash2 size={18} />
                 </button>
                 <div className="w-px h-6 bg-[#E5E7EB] my-auto mx-1"></div>
                 <button className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-md transition" title="More actions">
                    <MoreHorizontal size={18} />
                 </button>
              </div>

              {/* ⭐ Action Buttons - Core Interactivity ⭐ */}
              <div className="flex items-center gap-3">
                {selectedMail.evaluated ? (
                  <button
                    onClick={() => handleNext(selectedMail.id)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-bold rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-[#93C5FD] focus:outline-none focus:ring-offset-1"
                  >
                    Next Email
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction('safe', selectedMail.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] text-sm font-semibold rounded-lg border border-[#BBF7D0] transition-colors shadow-sm focus:ring-2 focus:ring-[#86EFAC] focus:outline-none focus:ring-offset-1"
                    >
                      <CheckCircle2 size={16} />
                      Mark as Safe
                    </button>
                    <div className="w-px h-6 bg-[#E5E7EB]"></div>
                    <button
                      onClick={() => handleAction('phish', selectedMail.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-sm font-semibold rounded-lg border border-[#FECACA] transition-colors shadow-sm focus:ring-2 focus:ring-[#FCA5A5] focus:outline-none focus:ring-offset-1"
                    >
                      <Siren size={16} />
                      Report Phishing
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Email Header */}
            <div className="px-10 py-8 border-b border-[#F3F4F6] bg-transparent flex-shrink-0">
               <h2 className="text-2xl font-bold text-[#111827] mb-6 tracking-tight leading-tight">
                 <HighlightedText text={selectedMail.subject || 'No Subject'} terms={highlightTerms} />
               </h2>
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#E0E7FF] text-[#4F46E5] rounded-full flex items-center justify-center text-xl font-bold border border-[#C7D2FE]">
                       {(selectedMail.sender || 'U').charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div className="font-bold text-[#111827] text-[15px] flex items-center gap-2">
                         <HighlightedText text={selectedMail.sender || 'Unknown Sender'} terms={highlightTerms} />
                         <span className="text-[#6B7280] font-normal text-sm">&lt;<HighlightedText text={selectedMail.senderEmail || 'unknown@example.com'} terms={highlightTerms} />&gt;</span>
                       </div>
                       <div className="text-sm text-[#6B7280] mt-0.5 font-medium">
                         To: employee@company.com
                       </div>
                     </div>
                  </div>
                  <div className="text-sm font-medium text-[#6B7280]">{selectedMail.time}</div>
               </div>
            </div>

            {/* Email Body */}
            <div className="p-10 flex-1 overflow-y-auto bg-transparent">
               <div className="max-w-3xl prose prose-slate">
                 <EmailContent
                   content={selectedMail.content || ''}
                   clues={selectedMail.clues || []}
                   showClues={showClues}
                   highlightTerms={highlightTerms}
                 />
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#9CA3AF] bg-[#F8FAFC]">
            <Mail size={80} strokeWidth={1} className="mb-6 text-[#E5E7EB]" />
            <h3 className="text-xl font-semibold text-[#4B5563]">Select an item to read</h3>
            <p className="mt-2 text-sm text-[#6B7280] text-center max-w-sm">
              Click on an email from the inbox list on the left to view its contents and perform security actions.
            </p>
          </div>
        )}
      </div>

      {/* ── Final Score Screen ── */}
      {isGameOver && (
        <FinalScoreScreen
          score={totalScore}
          maxScore={MAX_QUESTIONS * POINTS_PER_QUESTION}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
