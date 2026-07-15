import { useEffect, useMemo, useState } from "react";
import OverviewPieChart from "../../components/Charts/OverviewPieChart/OverviewPieChart";
import DailySpendChart from "../../components/Charts/DailySpendChart/DailySpendChart";
import FluctuationChart from "../../components/Charts/FluctuationChart";
import DateFilterBar from "../../components/DateFilterBar";
import RefreshButton from "../../components/RefreshButton";
import ThemeButton from "../../components/ThemeButton";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import { useStatisticsFilter } from "./useStatisticsFilter";
import TrendLineChart from "../../components/Charts/TrendLineChart/TrendLineChart";
import { Card, CardBody, CardHeader, ButtonGroup, Button } from "@heroui/react";
import * as analyticsApi from "../../services/analyticsApi";
import { ChartBar as BarChart3, TrendUp as TrendingUp, TrendDown as TrendingDown, Wallet, Receipt, ChartPie as PieChart, Heartbeat as Activity } from "@phosphor-icons/react";
import PageHeader from "../../components/ui/PageHeader";
import SectionHeader from "../../components/ui/SectionHeader";
import MetricTile from "../../components/ui/MetricTile";
import { Sparkle } from "@phosphor-icons/react";
import { motion } from "framer-motion";

/**
 * Component trang Thống Kê
 * Hiển thị các biểu đồ phân tích thu chi
 */
function Statistics() {
  const { isLoading, currentLedger } = useTransactionsContext();
  const { dateRange, setDateRange, dateRangeText } = useStatisticsFilter();
  const [fluctuationMode, setFluctuationMode] = useState("daily");

  const ledgerId = currentLedger?.id;
  const dateFrom = dateRange ? analyticsApi.toApiDate(dateRange.from) : undefined;
  const dateTo = dateRange ? analyticsApi.toApiDate(dateRange.to) : undefined;

  // Thẻ tổng quan: lấy từ BE (SQL aggregation), không tự tính từ transactions ở client
  const [overview, setOverview] = useState(null);
  useEffect(() => {
    if (!ledgerId) return;
    let active = true;
    analyticsApi
      .getOverview({ ledgerId, dateFrom, dateTo })
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải tổng quan thống kê:", err);
      });
    return () => {
      active = false;
    };
  }, [ledgerId, dateFrom, dateTo]);

  const stats = useMemo(
    () => ({
      income: overview?.totalIncomeVnd || 0,
      expense: overview?.totalExpenseVnd || 0,
      balance: overview?.balanceVnd || 0,
      transactionCount: overview?.transactionCount || 0,
    }),
    [overview]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div
      className={`space-y-6 pb-24 md:pb-6 transition-opacity duration-300 ${
        isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header Section */}
      <PageHeader
        title="Thống kê"
        subtitle="Phân tích chi tiết thu chi của bạn"
        actions={
          <>
            <ThemeButton />
            <RefreshButton />
          </>
        }
      />

      {/* Date Filter */}
      <DateFilterBar onDateRangeChange={setDateRange} />

      {dateRangeText && (
        <p className="text-sm text-default-500 -mt-2">{dateRangeText}</p>
      )}

      {/* AI Insight Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="liquid-glass p-4 rounded-xl border border-primary-500/20 bg-primary-500/5 flex items-start gap-3"
      >
        <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500">
          <Sparkle weight="duotone" className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-primary-600 dark:text-primary-400 mb-1">
            Vi Vu AI Insight
          </h4>
          <p className="text-sm text-default-600">
            {stats.expense > stats.income 
              ? "Tháng này bạn đang chi tiêu vượt quá thu nhập. Hãy xem xét cắt giảm các khoản chi không cần thiết để duy trì số dư an toàn nhé!"
              : "Tháng này bạn đang quản lý tài chính rất tốt. Mức chi tiêu nằm trong giới hạn thu nhập. Hãy tiếp tục duy trì!"}
          </p>
        </div>
      </motion.div>

      {/* Summary Stats — bề mặt phẳng, màu ngữ nghĩa chỉ ở con số */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div variants={itemVariants}>
          <MetricTile
            label="Tổng thu nhập"
            value={stats.income}
            tone="income"
            icon={TrendingUp}
            sign="+"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricTile
            label="Tổng chi tiêu"
            value={stats.expense}
            tone="expense"
            icon={TrendingDown}
            sign="−"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricTile
            label="Chênh lệch"
            value={stats.balance}
            tone="neutral"
            icon={Wallet}
            sign={stats.balance < 0 ? "−" : ""}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MetricTile
            label="Số giao dịch"
            value={stats.transactionCount.toLocaleString("vi-VN")}
            tone="neutral"
            icon={Receipt}
          />
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="space-y-6">
        <SectionHeader icon={PieChart} title="Phân tích theo danh mục" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ tròn */}
          <OverviewPieChart
            ledgerId={ledgerId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          {/* Biểu đồ cột chi tiêu theo ngày */}
          <DailySpendChart ledgerId={ledgerId} dateRange={dateRange} />
        </div>

        {/* Section Header - Biến động */}
        <SectionHeader icon={Activity} title="Biến động thu chi" className="pt-2" />

        {/* Biểu đồ Biến động Thu Chi - Full Width */}
        <Card className="bg-content1 border border-divider shadow-none" radius="lg">
          <CardHeader className="flex justify-between items-center px-5 sm:px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-[18px] h-[18px] text-primary" strokeWidth={2} />
              <h3 className="text-base font-semibold text-foreground">
                So sánh Thu - Chi
              </h3>
            </div>
            <ButtonGroup size="sm" variant="flat">
              <Button
                color={fluctuationMode === "daily" ? "primary" : "default"}
                onPress={() => setFluctuationMode("daily")}
              >
                Theo ngày
              </Button>
              <Button
                color={fluctuationMode === "monthly" ? "primary" : "default"}
                onPress={() => setFluctuationMode("monthly")}
              >
                Theo tháng
              </Button>
            </ButtonGroup>
          </CardHeader>
          <CardBody className="px-2 sm:px-6">
            <FluctuationChart ledgerId={ledgerId} viewMode={fluctuationMode} />
          </CardBody>
        </Card>

        {/* Biểu đồ xu hướng */}
        <TrendLineChart ledgerId={ledgerId} />
      </div>
    </div>
  );
}

export default Statistics;
