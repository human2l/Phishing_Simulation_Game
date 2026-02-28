'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Siren, XCircle } from 'lucide-react';

export interface ResultModalProps {
  isVisible: boolean;
  isCorrect: boolean;
  isPhishing: boolean;
  clues: string[];
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  isVisible,
  isCorrect,
  isPhishing,
  onClose,
}) => {
  const config = isCorrect
    ? {
        bg: 'bg-green-600',
        icon: <CheckCircle2 size={24} className="text-green-100" strokeWidth={2.5} />,
        message: 'Correct Classification!',
        subMessage: isPhishing ? 'Phishing attempt blocked.' : 'Legitimate email cleared.',
      }
    : {
        bg: 'bg-red-600',
        icon: <XCircle size={24} className="text-red-100" strokeWidth={2.5} />,
        message: 'Incorrect Classification!',
        subMessage: isPhishing ? 'Missed a phishing attempt.' : 'False alarm on safe email.',
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-[100] top-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] cursor-pointer select-none border border-white/20 ${config.bg}`}
          onClick={onClose}
          initial={{ opacity: 0, y: -40, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-black/10 p-2 rounded-full">
            {config.icon}
          </div>
          <div className="flex flex-col text-white">
             <span className="font-bold text-lg leading-tight">{config.message}</span>
             <span className="text-sm opacity-90 font-medium">{config.subMessage}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
