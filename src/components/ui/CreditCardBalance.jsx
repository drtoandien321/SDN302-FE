import { Wallet, Waveform, ContactlessPayment, CaretRight } from "@phosphor-icons/react";
import { formatCurrency } from "../../utils/formatCurrency";
import { motion } from "framer-motion";

const CreditCardBalance = ({ balance, isNegative }) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative w-full rounded-2xl overflow-hidden shimmer-effect liquid-glass text-white shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
      }}
    >
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>

      <div className="relative p-6 sm:p-8 z-10 flex flex-col justify-between h-full min-h-[200px]">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
              <Wallet className="w-4 h-4 text-white" weight="duotone" />
            </div>
            <span className="text-white/80 font-medium text-sm tracking-wide">
              VÍ VI VU CARD
            </span>
          </div>
          <ContactlessPayment className="w-6 h-6 text-white/50" weight="duotone" />
        </div>

        {/* Balance Area */}
        <div className="mt-8">
          <p className="text-white/60 text-sm mb-1 uppercase tracking-wider font-semibold">
            {isNegative ? "Đang Âm Trong Kỳ" : "Số Dư Khả Dụng"}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight vvv-tnum text-white">
              {isNegative ? "−" : ""}
              {formatCurrency(Math.abs(balance))}
            </h2>
            <span className="text-xl text-white/60 font-medium">VNĐ</span>
          </div>
        </div>

        {/* Footer / Card Number mockup */}
        <div className="mt-8 flex justify-between items-center pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-white/50 font-mono tracking-[0.2em] text-sm">
            <span>****</span>
            <span>****</span>
            <span>****</span>
            <span>2026</span>
          </div>
          
          {/* Quick Action Hint */}
          <button className="flex items-center gap-1 text-xs font-semibold text-primary-300 hover:text-white transition-colors">
            XEM CHI TIẾT
            <CaretRight className="w-3 h-3" weight="bold" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreditCardBalance;
