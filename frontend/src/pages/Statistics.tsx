import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../lib/api";
import { SalesDashboardResponse, SalesSummary } from "../types";

const PERIOD_OPTIONS = [
  { value: "DAILY", label: "일간" },
  { value: "WEEKLY", label: "주간" },
  { value: "MONTHLY", label: "월간" },
  { value: "YEARLY", label: "연간" }
];

export function Statistics() {
  const [period, setPeriod] = useState("DAILY");
  const [data, setData] = useState<SalesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await api.getSalesSummary(period);
        setData(normalizeDashboard(response));
      } finally {
        setLoading(false);
      }
    };
    void fetchSummary();
  }, [period]);

  const { summary, pieData } = useMemo(() => {
    const summaryData: SalesSummary | null = data?.summary ?? null;
    const pie = summaryData?.top_menu_items.map((item) => ({
      name: item.name,
      value: Number(item.revenue)
    })) ?? [];
    return { summary: summaryData, pieData: pie };
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) {
      return {
        daily: [],
        weekly: [],
        monthly: [],
        yearly: [],
        combined: [] as { label: string; monthly?: number; yearly?: number }[]
      };
    }
    const combinedMap = new Map<string, { label: string; monthly?: number; yearly?: number }>();
    data.monthly.forEach((point) => {
      combinedMap.set(point.label, { label: point.label, monthly: point.value });
    });
    data.yearly.forEach((point) => {
      const existing = combinedMap.get(point.label);
      if (existing) {
        existing.yearly = point.value;
      } else {
        combinedMap.set(point.label, { label: point.label, yearly: point.value });
      }
    });
    return {
      daily: data.daily,
      weekly: data.weekly,
      monthly: data.monthly,
      yearly: data.yearly,
      combined: Array.from(combinedMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      )
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">매장 통계</h1>
          <p className="text-xs text-slate-500">
            매출, 고객 만족도, 인기 메뉴 현황을 실시간으로 확인하세요.
          </p>
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:border-brand-accent focus:outline-none"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="총 매출"
          value={summary ? `₩${Number(summary.total_revenue).toLocaleString()}` : "-"}
          description={`${periodLabel(period)} 누적 매출`}
        />
        <SummaryCard
          title="총 주문 수"
          value={summary?.total_orders ?? "-"}
          description="동일 기간 주문 건수"
        />
        <SummaryCard
          title="평균 객단가"
          value={
            summary ? `₩${Number(summary.average_order_value).toLocaleString()}` : "-"
          }
          description="주문당 평균 매출"
        />
        <SummaryCard
          title="평균 만족도"
          value={summary?.average_rating ? `${summary.average_rating.toFixed(1)}점` : "-"}
          description="고객 피드백 기준"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="일간 매출 추이" loading={loading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="메뉴별 매출 비중" loading={loading}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                fill="#f97316"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="주간 매출" loading={loading}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="월간/연간 추이 비교" loading={loading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData.combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line name="월간" type="monotone" dataKey="monthly" stroke="#f97316" strokeWidth={2} />
              <Line name="연간" type="monotone" dataKey="yearly" stroke="#22d3ee" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="text-sm text-slate-400">{title}</h3>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function ChartCard({
  title,
  children,
  loading
}: {
  title: string;
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {loading && <span className="text-xs text-slate-500">갱신 중...</span>}
      </header>
      <div className="h-72">{children}</div>
    </article>
  );
}

function periodLabel(value: string) {
  switch (value) {
    case "DAILY":
      return "일간";
    case "WEEKLY":
      return "주간";
    case "MONTHLY":
      return "월간";
    case "YEARLY":
      return "연간";
    default:
      return "";
  }
}

function normalizeDashboard(response: any): SalesDashboardResponse {
  return {
    summary: {
      ...response.summary,
      total_revenue: Number(response.summary.total_revenue ?? 0),
      total_orders: Number(response.summary.total_orders ?? 0),
      average_order_value: Number(response.summary.average_order_value ?? 0),
      average_rating: response.summary.average_rating
        ? Number(response.summary.average_rating)
        : undefined,
      period: response.summary.period,
      top_menu_items: response.summary.top_menu_items.map((item: any) => ({
        name: item.name,
        revenue: Number(item.revenue ?? 0)
      }))
    },
    daily: response.daily.map((point: any) => ({
      label: point.label,
      value: Number(point.value ?? 0)
    })),
    weekly: response.weekly.map((point: any) => ({
      label: point.label,
      value: Number(point.value ?? 0)
    })),
    monthly: response.monthly.map((point: any) => ({
      label: point.label,
      value: Number(point.value ?? 0)
    })),
    yearly: response.yearly.map((point: any) => ({
      label: point.label,
      value: Number(point.value ?? 0)
    }))
  };
}

