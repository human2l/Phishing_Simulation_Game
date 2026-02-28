import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, PartyPopper, RefreshCw, ShieldAlert } from 'lucide-react';

interface FinalScoreScreenProps {
  score: number;
  maxScore: number;
  onRestart: () => void;
}

export function FinalScoreScreen({ score, maxScore, onRestart }: FinalScoreScreenProps) {
  const percentage = (score / maxScore) * 100;
  
  let resultProps = {
    title: 'Needs Training',
    desc: 'Your security awareness needs substantial improvement. You missed critical signs of deception.',
    color: 'text-red-500',
    bg: 'bg-red-500',
    border: 'border-red-200',
    icon: <ShieldAlert size={48} className="text-red-500" />
  };

  if (percentage >= 80) {
    resultProps = {
      title: 'Security Expert',
      desc: 'Outstanding performance! You have a keen eye for identifying sophisticated phishing attempts.',
      color: 'text-green-500',
      bg: 'bg-green-500',
      border: 'border-green-200',
      icon: <PartyPopper size={48} className="text-green-500" />
    };
  } else if (percentage >= 60) {
    resultProps = {
      title: 'Vigilant User',
      desc: 'Good effort. You caught most threats, but a few subtle attacks managed to slip through.',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500',
      border: 'border-yellow-200',
      icon: <ShieldAlert size={48} className="text-yellow-500" />
    };
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center relative border border-gray-100"
        >
          {/* Header Icon */}
          <div className="flex justify-center mb-6 relative">
            <div className={`absolute inset-0 ${resultProps.bg} blur-3xl opacity-20 rounded-full scale-150 transform`}></div>
            <div className={`p-4 rounded-full bg-white shadow-xl border-4 ${resultProps.border} relative z-10`}>
              {resultProps.icon}
            </div>
          </div>

          <h2 className={`text-4xl font-black tracking-tight mb-2 ${resultProps.color}`}>
            {resultProps.title}
          </h2>
          <p className="text-gray-500 font-medium text-[15px] mb-8 leading-relaxed max-w-md mx-auto">
            {resultProps.desc}
          </p>

          {/* Score Display */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Final Score</div>
            <div className="flex items-end justify-center gap-2">
               <motion.span 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                 className={`text-7xl font-black leading-none ${resultProps.color}`}
               >
                 {score}
               </motion.span>
               <span className="text-2xl font-bold text-gray-400 mb-2">/ {maxScore}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
            >
              <RefreshCw size={20} />
              Play Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold text-[15px] py-3 px-8 rounded-xl transition-all"
            >
              <LogIn size={18} />
              Return to Login
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
