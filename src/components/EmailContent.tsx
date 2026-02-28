import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

interface EmailContentProps {
  content: string;
  clues: string[];
  showClues: boolean;
}

export function EmailContent({ content, clues, showClues }: EmailContentProps) {
  // If we don't need to show clues, just render the content normally
  if (!showClues || clues.length === 0) {
    return (
      <div className="text-[15px] leading-relaxed text-[#374151] whitespace-pre-wrap font-medium">
        {content}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={cn(
        "text-[15px] leading-relaxed text-[#374151] whitespace-pre-wrap font-medium transition-all duration-500",
        showClues ? "opacity-40" : "opacity-100"
      )}>
        {content}
      </div>

      <AnimatePresence>
        {showClues && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, staggerChildren: 0.1 }}
            className="absolute top-0 left-0 w-full h-full flex flex-col gap-3 pointer-events-none"
          >
            {clues.map((clue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.2 }}
                className="bg-white/95 backdrop-blur-sm border-2 border-red-500/30 shadow-xl rounded-xl p-4 flex gap-3 pointer-events-auto transform transition-transform hover:-translate-y-1 hover:shadow-2xl hover:border-red-500/50"
              >
                  <div className="mt-0.5 bg-red-100/50 p-1.5 rounded-lg h-fit">
                     <Search className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                       <span>Clue #{index + 1}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 leading-snug">
                       {clue}
                    </div>
                  </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
