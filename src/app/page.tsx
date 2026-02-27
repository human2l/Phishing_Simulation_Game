'use client';

import SwipeCard, { CardData } from '@/components/SwipeCard';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mail, RefreshCcw, Shield } from 'lucide-react';
import { useState } from 'react';

const INITIAL_CARDS: CardData[] = [
  {
    id: '1',
    sender: 'IT 支持部门',
    senderEmail: 'it-support@company-safety.com',
    subject: '🚨 紧急：您的账户密码即将过期，请立即更改',
    content: '尊敬的员工：\n\n系统检测到您的邮箱账户密码将在24小时内过期。\n为避免影响您的正常使用，请立即点击下方链接进行验证并重置密码：\n\nhttp://reset.company-safety.com/auth\n\n如未在规定时间内操作，账号将被自动锁定。\n\n技术支持团队\n2025年10月24日',
    isPhishing: true,
    time: '上午 09:15',
  },
  {
    id: '2',
    sender: 'HR 团队',
    senderEmail: 'hr@your-company.com',
    subject: '📅 关于端午节假期的放假通知',
    content: '各位同事，大家好：\n\n根据国家法定节假日规定，结合我司实际情况，现将今年端午节放假安排通知如下：\n\n1. 放假时间：下周一至周三。\n2. 节前请各位妥善安排好工作，关闭电器电源。\n祝大家端午安康！\n\n人力资源部',
    isPhishing: false,
    time: '昨天 16:30',
  },
  {
    id: '3',
    sender: '李总 (CEO)',
    senderEmail: 'ceo-office@mail.private-ceo.com',
    subject: '需要你帮个忙（保密）',
    content: '小王，我现在在外面开会，急需给一个客户打款。\n财务那边联系不上，你能不能先帮我垫付一下？\n这笔钱明天一早就让财务转给你。款项请打到这个个人账户：\n\n卡号：6222 *** 1111\n\n一定要保密，不要让其他人知道。',
    isPhishing: true,
    time: '刚刚',
  },
];

export default function Home() {
  const [cards, setCards] = useState<CardData[]>(INITIAL_CARDS);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const handleSwipe = (direction: 'left' | 'right', isPhishing: boolean) => {
    // left: trust, right: report
    const trustedPhishing = direction === 'left' && isPhishing;
    const reportedSafe = direction === 'right' && !isPhishing;
    
    if (trustedPhishing || reportedSafe) {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    } else {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    }

    setTimeout(() => {
      setCards((prev) => prev.slice(1));
    }, 200);
  };

  const resetGame = () => {
    setCards(INITIAL_CARDS);
    setScore({ correct: 0, wrong: 0 });
  };

  return (
    <main className="min-h-screen bg-[#FDF9F1] flex flex-col items-center py-10 px-4 font-sans selection:bg-[#FFDCA8]">
      
      {/* Header Info */}
      <header className="w-full max-w-md bg-white rounded-2xl shadow-sm border-2 border-[#EAE2D6] p-4 flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#4FA888]/10 p-2 rounded-xl text-[#4FA888]">
            <Shield size={22} className="stroke-[2.5px]" />
          </div>
          <div className="font-bold text-[#4A3D34]">
             防御成功:<span className="text-[#4FA888] ml-1">{score.correct}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-[#D97757]/10 p-2 rounded-xl text-[#D97757]">
            <AlertTriangle size={22} className="stroke-[2.5px]" />
          </div>
          <div className="font-bold text-[#4A3D34]">
             中招:<span className="text-[#D97757] ml-1">{score.wrong}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="relative w-full max-w-md h-[500px] flex justify-center items-center">
        {cards.length > 0 ? (
          <AnimatePresence>
            {cards.map((card, index) => {
              // Only render the top 2 cards to save performance
              if (index > 1) return null;
              const isTop = index === 0;

              return (
                <div
                  key={card.id}
                  className="absolute inset-0"
                  style={{ zIndex: cards.length - index }}
                >
                  <SwipeCard
                    card={card}
                    onSwipe={handleSwipe}
                    active={isTop}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white p-8 rounded-3xl border-2 border-[#EAE2D6] w-full h-full shadow-sm text-center">
            <div className="w-20 h-20 bg-[#FFDCA8] rounded-3xl flex items-center justify-center text-[#995C1F] mb-6 rotate-12">
              <Mail size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-[#4A3D34] mb-2">收件箱已清空</h2>
            <p className="text-[#8B7C71] font-medium mb-8">
              太棒了！你处理了所有的工作邮件。
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-[#4A3D34] hover:bg-[#3A2D24] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-[0_4px_0_rgb(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
            >
              <RefreshCcw size={18} strokeWidth={2.5} />
              重新开始训练
            </button>
          </div>
        )}
      </div>

    </main>
  );
}
