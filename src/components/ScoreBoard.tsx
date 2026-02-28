import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  totalAnswered: number;
  maxQuestions: number;
}

export function ScoreBoard({ score, totalAnswered, maxQuestions }: ScoreBoardProps) {
  const maxScore = maxQuestions * 10;
  const scorePercentage = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const progressPercentage = Math.max(0, Math.min(100, (totalAnswered / maxQuestions) * 100));
  
  // Color based on score percentage
  const getScoreColor = () => {
    if (totalAnswered === 0) return 'text-[#9CA3AF]'; // Neutral at start
    if (scorePercentage >= 80) return 'text-green-500';
    if (scorePercentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };



  return (
    <div className="bg-[#1F2937] p-5 rounded-xl border border-[#374151] shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 opacity-[0.03] transform rotate-12">
        <Target size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-1 shadow-sm">
              Security Clearance
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter leading-none ${getScoreColor()}`}>
                {score}
              </span>
              <span className="text-sm font-bold text-[#6B7280]">/ {maxQuestions * 10}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
             <div className="text-[10px] uppercase font-bold text-[#6B7280] mb-1">Progress</div>
             <div className="bg-[#374151] text-white text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap inline-block">
               {totalAnswered} / {maxQuestions}
             </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[#374151] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>
      </div>
    </div>
  );
}
