import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { HighlightedText } from './HighlightText';

interface EmailContentProps {
  content: string;
  clues: string[];
  showClues: boolean;
  highlightTerms: string[];
}

export function EmailContent({ content, clues, showClues, highlightTerms }: EmailContentProps) {
  return (
    <div className="flex flex-col gap-10 pb-8">
      {/* Original Content with Highlights */}
      <div className="text-[15px] leading-relaxed text-[#374151] whitespace-pre-wrap font-medium">
        {showClues ? (
          <HighlightedText text={content} terms={highlightTerms} />
        ) : (
          content
        )}
      </div>

      {/* Clues Section Appended Below (Does not block original content) */}
      <AnimatePresence>
        {showClues && clues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t-2 border-dashed border-red-200 pt-6 mt-2"
          >
            <div className="flex items-center gap-2 text-red-700 font-bold text-[17px] mb-5">
              <AlertTriangle size={20} />
              <h2>Phishing Clues Analysis</h2>
            </div>
            <div className="space-y-3">
              {clues.map((clue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-red-50/80 border border-red-100 rounded-lg p-4 flex gap-3 text-[14px] text-red-900 shadow-sm"
                >
                  <div className="bg-red-100/80 border border-red-200 text-red-600 rounded-full w-[22px] h-[22px] flex items-center justify-center flex-shrink-0 font-bold text-xs mt-[2px]">
                    {index + 1}
                  </div>
                  <div className="leading-relaxed font-medium">
                    <HighlightedText text={clue} terms={highlightTerms} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
