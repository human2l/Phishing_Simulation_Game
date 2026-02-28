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

  // Let's determine the true scenario (TP/TN/FP/FN) to pick the correct character image
  let imageSrc = '';
  let imageAlt = '';

  if (isCorrect && isPhishing) {
    // True Positive
    imageSrc = '/images/bubu-happy.png';
    imageAlt = 'Bubu 点赞';
  } else if (isCorrect && !isPhishing) {
    // True Negative
    imageSrc = '/images/bubu-steady.png';
    imageAlt = 'Bubu 稳健工作';
  } else if (!isCorrect && isPhishing) {
    // False Negative
    imageSrc = '/images/dudu-crying.png';
    imageAlt = 'Dudu 大哭不妙';
  } else {
    // False Positive
    imageSrc = '/images/dudu-confused.png';
    imageAlt = 'Dudu 挠头困惑';
  }

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
            ? 'Bubu说："太棒了打工人！成功拦截一次钓鱼攻击！"'
            : 'Bubu说："工作邮件已确认，这是正常信件。放过正常也是防御！"',
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
          ? 'Bubu说："Dudu 漏掉了一封高危钓鱼邮件！来看看它的破绽："'
          : 'Bubu说："Dudu 误判了一封正常邮件，这样会耽误进度哦！"',
        messageColor: 'text-[#A05030]',
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className={`fixed z-50 bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md
              rounded-3xl border-4 shadow-[0_24px_50px_rgba(0,0,0,0.15)] overflow-hidden
              ${config.bg} ${config.border}`}
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#B3A69A] hover:text-[#4A3D34] transition-colors z-10"
              aria-label="关闭"
            >
              <XCircle size={26} strokeWidth={2.5} className="drop-shadow-sm" />
            </button>

            {/* Top area: Character Image & Title */}
            <div className="relative pt-6 px-6 pb-2 text-center pointer-events-none">
              
              {/* Character specific illustration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="mx-auto mt-2 mb-4 w-32 h-32 rounded-2xl bg-[#EAE2D6]/40 flex items-center justify-center border-2 border-dashed border-[#CFBCA0] overflow-hidden"
              >
                {/* 
                  Fallback text in case image is missing.
                  The user/artist will drop real files into /public/images/
                */}
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="object-contain w-full h-full drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-[#A6937C] text-sm font-bold opacity-60';
                      fallback.innerText = `[${imageAlt}]`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </motion.div>

              <div className="flex flex-col items-center gap-2">
                <h2 className={`text-2xl font-black tracking-wide ${config.titleColor}`}>
                  {config.title}
                </h2>
              </div>
            </div>

            {/* Bottom area: Dialogue and Clues */}
            <div className={`p-6 bg-white/50 border-t-2 ${config.border}`}>
              <motion.p
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
                 className={`text-base font-bold mb-4 leading-relaxed ${config.messageColor} text-center`}
              >
                {config.message}
              </motion.p>

              {/* Clues list — only shown when player was wrong about a phishing email */}
              {showClues && (
                <motion.ul
                  className="space-y-2 mt-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
                  }}
                >
                  {clues.map((clue, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2.5 bg-white border-2 border-[#F5C4A8] rounded-xl px-4 py-3 shadow-sm"
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <CheckCircle2
                        size={18}
                        className="text-[#D97757] flex-shrink-0 mt-0.5 drop-shadow-sm"
                        strokeWidth={3}
                      />
                      <span className="text-[#8A5233] text-sm font-semibold leading-snug">{clue}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
