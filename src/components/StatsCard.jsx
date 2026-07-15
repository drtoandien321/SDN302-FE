import { TrendUp as TrendingUp, TrendDown as TrendingDown } from "@phosphor-icons/react";
import MetricTile from "./ui/MetricTile";
import CreditCardBalance from "./ui/CreditCardBalance";

/**
 * StatsCards — ba chỉ số tổng quan với PHÂN CẤP rõ ràng:
 * - Số dư: bề mặt chính, trọng lượng thị giác mạnh nhất.
 * - Tổng thu / Tổng chi: chỉ số phụ, nhỏ hơn.
 * Bề mặt phẳng, viền 1px, số dạng tabular; màu ngữ nghĩa chỉ áp cho con số.
 *
 * @param {number} totalIncome
 * @param {number} totalExpense
 * @param {number} balance
 */
const StatsCards = ({ totalIncome, totalExpense, balance }) => {
  const balanceNegative = balance < 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Bề mặt chính: Số dư Credit Card */}
      <CreditCardBalance balance={balance} isNegative={balanceNegative} />

      {/* Chỉ số phụ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <MetricTile
          label="Tổng thu"
          value={totalIncome}
          tone="income"
          icon={TrendingUp}
          sign="+"
        />
        <MetricTile
          label="Tổng chi"
          value={totalExpense}
          tone="expense"
          icon={TrendingDown}
          sign="−"
        />
      </div>
    </div>
  );
};

export default StatsCards;
