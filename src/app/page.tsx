'use client';

import ResultModal from '@/components/ResultModal';
import SwipeCard, { CardData } from '@/components/SwipeCard';
import { GeneratedEmail } from '@/lib/ai';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, Loader2, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ModalState {
  isVisible: boolean;
  isCorrect: boolean;
  isPhishing: boolean;
  clues: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function emailToCard(email: GeneratedEmail, id: string): CardData {
  return { ...email, id };
}

async function fetchEmail(): Promise<GeneratedEmail> {
  const res = await fetch('/api/generate-email');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="absolute inset-0 w-full h-[500px] bg-[#FFFDF7] rounded-3xl border-2 border-[#EAE2D6] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col animate-pulse">
      {/* Header */}
      <div className="bg-[#fcf8f2] px-6 py-5 border-b-2 border-[#EAE2D6] flex items-center gap-3">
        <div className="w-12 h-12 bg-[#EAE2D6] rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#EAE2D6] rounded-full w-2/5" />
          <div className="h-3 bg-[#EAE2D6] rounded-full w-3/5" />
        </div>
      </div>
      {/* Body */}
      <div className="p-6 flex-1 space-y-3">
        <div className="h-5 bg-[#EAE2D6] rounded-full w-4/5" />
        <div className="h-4 bg-[#EAE2D6] rounded-full" />
        <div className="h-4 bg-[#EAE2D6] rounded-full w-3/4" />
        <div className="h-4 bg-[#EAE2D6] rounded-full w-5/6" />
        <div className="h-4 bg-[#EAE2D6] rounded-full w-2/3" />
      </div>
      {/* Footer */}
      <div className="bg-[#F4EFE6] px-6 py-4 border-t-2 border-[#EAE2D6] flex items-center justify-between">
        <div className="h-4 w-20 bg-[#EAE2D6] rounded-full" />
        <div className="h-4 w-20 bg-[#EAE2D6] rounded-full" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const MAX_PRELOAD = 3; // how many cards to keep in the deck at most

export default function Home() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);   // initial load
  const [isFetching, setIsFetching] = useState(false); // background fetch
  const [score, setScore] = useState({ tp: 0, tn: 0, fp: 0, fn: 0, total: 0 });
  const [modal, setModal] = useState<ModalState>({
    isVisible: false,
    isCorrect: false,
    isPhishing: false,
    clues: [],
  });
  const [gameOver, setGameOver] = useState(false);

  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardCounter = useRef(0); // stable unique id generator

  // ── Fetch + append a new card to the deck ──
  const addCard = useCallback(async () => {
    setIsFetching(true);
    try {
      const email = await fetchEmail();
      const id = `card-${++cardCounter.current}`;
      setCards((prev) => {
        if (prev.length >= MAX_PRELOAD) return prev; // safety cap
        return [...prev, emailToCard(email, id)];
      });
    } catch (err) {
      console.error('[page.tsx] Failed to fetch email:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // ── Initial boot: load 3 cards in parallel ──
  useEffect(() => {
    const boot = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.allSettled([fetchEmail(), fetchEmail(), fetchEmail()]);
        const initial: CardData[] = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            initial.push(emailToCard(r.value, `card-${++cardCounter.current}`));
          }
        });
        setCards(initial);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, []);

  // ── Close modal ──
  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isVisible: false }));
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  }, []);

  // ── Auto-close modal after 2.5s ──
  useEffect(() => {
    if (modal.isVisible) {
      autoCloseTimer.current = setTimeout(closeModal, 2500);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [modal.isVisible, closeModal]);

  // ── Handle swipe ──
  const handleSwipe = useCallback(
    (direction: 'left' | 'right', isPhishing: boolean, clues: string[]) => {
      const isCorrect =
        (direction === 'right' && isPhishing) || (direction === 'left' && !isPhishing);

      setScore((s) => {
        let tp = s.tp, tn = s.tn, fp = s.fp, fn = s.fn;
        if (direction === 'right' && isPhishing) tp++; // 捕捉恶意
        if (direction === 'left' && !isPhishing) tn++; // 放过正常
        if (direction === 'right' && !isPhishing) fp++; // 误判正常
        if (direction === 'left' && isPhishing) fn++; // 漏掉恶意

        return { tp, tn, fp, fn, total: s.total + 1 };
      });

      // Show result modal 300ms after swipe starts
      setTimeout(() => {
        setModal({ isVisible: true, isCorrect, isPhishing, clues });
      }, 300);

      // Remove the top card
      setTimeout(() => {
        setCards((prev) => {
          const next = prev.slice(1);
          return next;
        });
      }, 200);

      // Pre-fetch the next card to keep deck topped-up
      setTimeout(() => {
        addCard();
      }, 600);
    },
    [addCard],
  );

  // ── Reset ──
  const resetGame = () => {
    setCards([]);
    setScore({ tp: 0, tn: 0, fp: 0, fn: 0, total: 0 });
    setGameOver(false);
    closeModal();
    cardCounter.current = 0;

    // Re-boot
    setIsLoading(true);
    Promise.allSettled([fetchEmail(), fetchEmail(), fetchEmail()]).then((results) => {
      const initial: CardData[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          initial.push(emailToCard(r.value, `card-${++cardCounter.current}`));
        }
      });
      setCards(initial);
      setIsLoading(false);
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#FDF9F1] flex flex-col items-center py-10 px-4 font-sans">

      {/* ── Header scoreboard ── */}
      <header className="w-full max-w-md bg-white rounded-2xl shadow-sm border-2 border-[#EAE2D6] p-3 mb-10 relative">
        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-[#4A3D34]">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center bg-[#EDFAF4] px-2.5 py-1.5 rounded-lg border border-[#A8DFCA]">
              <span className="text-[#2E7D6A]">🎯 捕捉恶意</span>
              <span className="text-sm text-[#2E7D6A]">{score.tp}</span>
            </div>
            <div className="flex justify-between items-center bg-[#EDFAF4] px-2.5 py-1.5 rounded-lg border border-[#A8DFCA]">
              <span className="text-[#2E7D6A]">✅ 放过正常</span>
              <span className="text-sm text-[#2E7D6A]">{score.tn}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center bg-[#FFF4EE] px-2.5 py-1.5 rounded-lg border border-[#F5C4A8]">
              <span className="text-[#A0402A]">❌ 误判正常</span>
              <span className="text-sm text-[#A0402A]">{score.fp}</span>
            </div>
            <div className="flex justify-between items-center bg-[#FFF4EE] px-2.5 py-1.5 rounded-lg border border-[#F5C4A8]">
              <span className="text-[#A0402A]">⚠️ 漏掉恶意</span>
              <span className="text-sm text-[#A0402A]">{score.fn}</span>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <AnimatePresence>
          {isFetching && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[#B3A69A] text-xs font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-[#EAE2D6]"
            >
              <Loader2 size={12} className="animate-spin" />
              通讯中...
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Card area ── */}
      <div className="relative w-full max-w-md h-[500px] flex justify-center items-center">

        {/* Initial loading state */}
        {isLoading && <SkeletonCard />}

        {/* Cards */}
        {!isLoading && cards.length > 0 && (
          <AnimatePresence>
            {cards.map((card, index) => {
              if (index > 1) return null;
              return (
                <div
                  key={card.id}
                  className="absolute inset-0"
                  style={{ zIndex: cards.length - index }}
                >
                  {/* Second card: slightly offset behind the top card */}
                  {index === 1 && (
                    <div className="absolute inset-0 bg-[#FFFDF7] rounded-3xl border-2 border-[#EAE2D6] scale-95 translate-y-3 shadow-sm" />
                  )}
                  {index === 0 && (
                    <SwipeCard card={card} onSwipe={handleSwipe} active={true} />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Empty state — deck exhausted (only if not loading) */}
        {!isLoading && cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center bg-white p-8 rounded-3xl border-2 border-[#EAE2D6] w-full h-full shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-[#FFDCA8] rounded-3xl flex items-center justify-center text-[#995C1F] mb-6 rotate-12">
              <Inbox size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-[#4A3D34] mb-2">收件箱已清空！</h2>
            <p className="text-[#8B7C71] font-semibold mb-1">
              共处理 {score.total} 封 · 防御 {score.tp + score.tn} 封 · 中招 {score.fp + score.fn} 封
            </p>
            <p className="text-[#B3A69A] text-sm mb-8">
              {score.fp + score.fn === 0
                ? '🏆 完美防御！Bubu 向你竖起大拇指！'
                : score.fp + score.fn <= 1
                ? '💪 干得不错！Bubu 说："再练练，你就是职场防线战神！"'
                : '📬 Bubu 说："网络安全靠大家，再来一次！"'}
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-[#4A3D34] hover:bg-[#3A2D24] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
            >
              <RefreshCcw size={18} strokeWidth={2.5} />
              重新开始训练
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Result Modal ── */}
      <ResultModal
        isVisible={modal.isVisible}
        isCorrect={modal.isCorrect}
        isPhishing={modal.isPhishing}
        clues={modal.clues}
        onClose={closeModal}
      />
    </main>
  );
}
