'use client';

import { cn } from '@/lib/utils';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Clock, Mail } from 'lucide-react';
import React, { useState } from 'react';

export interface CardData {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  content: string;
  isPhishing: boolean;
  clues: string[];  // phishing email clues for ResultModal
  time: string;
}

interface SwipeCardProps {
  card: CardData;
  onSwipe: (direction: 'left' | 'right', isPhishing: boolean, clues: string[]) => void;
  active: boolean; // Is it the top card?
}

const SwipeCard: React.FC<SwipeCardProps> = ({ card, onSwipe, active }) => {
  const [exitX, setExitX] = useState<number>(0);
  const x = useMotionValue(0);

  // Rotate based on x position
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  // Opacity of "钓鱼/忽略" (Left) and "安全/举报" (Right) stamps
  const opacityLeft = useTransform(x, [-100, -20], [1, 0]);
  const opacityRight = useTransform(x, [20, 100], [0, 1]);
  // Scale down the card slightly when swiped
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      setExitX(300);
      onSwipe('right', card.isPhishing, card.clues);
    } else if (info.offset.x < -swipeThreshold) {
      setExitX(-300);
      onSwipe('left', card.isPhishing, card.clues);
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute w-full h-[500px] border-2 bg-[#FFFDF7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden cursor-grab active:cursor-grabbing",
        "border-[#EAE2D6] flex flex-col"
      )}
      style={{
        x,
        rotate,
        scale,
      }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX, opacity: exitX !== 0 ? 0 : 1, transition: { duration: 0.3 } }}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
    >
      {/* Stamps for interactive feedback */}
      <motion.div
        className="absolute top-8 right-8 z-10 border-4 border-rose-400 text-rose-400 font-bold text-3xl px-4 py-2 rounded-xl rotate-12 bg-white/50 backdrop-blur-sm"
        style={{ opacity: opacityLeft }}
      >
        信任
      </motion.div>
      <motion.div
        className="absolute top-8 left-8 z-10 border-4 border-emerald-500 text-emerald-500 font-bold text-3xl px-4 py-2 rounded-xl -rotate-12 bg-white/50 backdrop-blur-sm"
        style={{ opacity: opacityRight }}
      >
        举报并防御
      </motion.div>

      {/* Card Header */}
      <div className="bg-[#fcf8f2] px-6 py-5 border-b-2 border-[#EAE2D6] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FFDCA8] rounded-2xl flex items-center justify-center text-[#995C1F]">
            <Mail size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-[#4A3D34] text-lg leading-tight">{card.sender}</h3>
            <p className="text-[#8B7C71] text-xs flex items-center gap-1 mt-0.5">
              <span>{card.senderEmail}</span>
            </p>
          </div>
        </div>
        <div className="text-[#B3A69A] text-xs font-medium flex items-center gap-1">
          <Clock size={14} />
          {card.time}
        </div>
      </div>

      {/* Card Body (Email content) */}
      <div className="p-6 flex-1 overflow-y-auto pointer-events-none">
        <h2 className="text-xl font-bold text-[#4A3D34] mb-4 leading-snug">{card.subject}</h2>
        <div className="text-[#6B5C51] text-base leading-relaxed whitespace-pre-wrap font-medium">
          {card.content}
        </div>
      </div>

      {/* Card Footer (Instruction hint) */}
      <div className="bg-[#F4EFE6] px-6 py-4 flex items-center justify-between pointer-events-none border-t-2 border-[#EAE2D6]">
        <div className="flex items-center gap-2 text-[#D97757] font-bold text-sm">
           👈 左滑 信任
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-1 rounded-full bg-[#D4C8BA]" />
        </div>
        <div className="flex items-center gap-2 text-[#4FA888] font-bold text-sm">
          右滑 拦截 👉
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
