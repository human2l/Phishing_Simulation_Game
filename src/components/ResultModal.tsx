'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Siren, XCircle } from 'lucide-react';

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
  clues,
  onClose,
}) => {
  // --- Derived display logic ---
  const showClues = !isCorrect && isPhishing && clues.length > 0;

  const config = isCorrect
    ? {
        bg: 'bg-[#EDFAF4]',
        border: 'border-[#A8DFCA]',
        iconBg: 'bg-[#4FA888]',
        icon: <ShieldCheck size={32} className="text-white" strokeWidth={2.5} />,
        title: '🛡️ 防御成功！',
        titleColor: 'text-[#2E7D6A]',
        message:
          isPhishing
            ? 'Bubu说："太棒了打工人！这封邮件有问题！眼放亮！"'
            : 'Bubu说："工作邮件已确认，这是正常信件。保持警惕！"',
        messageColor: 'text-[#3E8C72]',
      }
    : {
        bg: 'bg-[#FFF4EE]',
        border: 'border-[#F5C4A8]',
        iconBg: 'bg-[#D97757]',
        icon: <Siren size={32} className="text-white" strokeWidth={2.5} />,
        title: '🪤 中招了！',
        titleColor: 'text-[#A0402A]',
        message: isPhishing
          ? 'Bubu说："Dudu 上当了... 来看看这封邮件的破绽："'
          : 'Bubu说："Dudu 误报了一封正常邮件，要相信自己的同事！"',
        messageColor: 'text-[#A05030]',
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={`fixed z-50 bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md
              rounded-3xl border-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-6
              ${config.bg} ${config.border}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#B3A69A] hover:text-[#4A3D34] transition-colors"
              aria-label="关闭"
            >
              <XCircle size={22} strokeWidth={2} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
                {config.icon}
              </div>
              <h2 className={`text-2xl font-bold leading-tight ${config.titleColor}`}>
                {config.title}
              </h2>
            </div>

            {/* Message / Bubu dialogue */}
            <p className={`text-sm font-semibold mb-4 leading-relaxed ${config.messageColor}`}>
              {config.message}
            </p>

            {/* Clues list — only shown when player was wrong about a phishing email */}
            {showClues && (
              <motion.ul
                className="space-y-2"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                {clues.map((clue, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2 bg-white/60 border border-[#F5C4A8] rounded-xl px-3 py-2"
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <CheckCircle2
                      size={16}
                      className="text-[#D97757] flex-shrink-0 mt-0.5"
                      strokeWidth={2.5}
                    />
                    <span className="text-[#7A4A30] text-sm font-medium">{clue}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
