"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PnLDataPoint {
  time: string;
  pnl: number;
  symbol: string;
}

interface PnLChartProps {
  data: PnLDataPoint[];
}

export default function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-[var(--text)]/50">
        No trading data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((point, index) => ({
    ...point,
    index,
    formattedTime: new Date(point.time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const minPnl = Math.min(...data.map((d) => d.pnl));
  const maxPnl = Math.max(...data.map((d) => d.pnl));
  const padding = (maxPnl - minPnl) * 0.1 || 10;

  const lineColor = chartData[chartData.length - 1]?.pnl >= 0 ? "#298931" : "#a01c1a";

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 42, 31, 0.12)" vertical={false} />
          <XAxis
            dataKey="formattedTime"
            tick={{ fill: "rgba(33, 42, 31, 0.5)", fontSize: 11 }}
            tickLine={{ stroke: "rgba(33, 42, 31, 0.2)" }}
            axisLine={{ stroke: "rgba(33, 42, 31, 0.2)" }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tick={{ fill: "rgba(33, 42, 31, 0.5)", fontSize: 11 }}
            tickLine={{ stroke: "rgba(33, 42, 31, 0.2)" }}
            axisLine={{ stroke: "rgba(33, 42, 31, 0.2)" }}
            domain={[minPnl - padding, maxPnl + padding]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#e6e2c8",
              border: "1px solid rgba(33, 42, 31, 0.2)",
              borderRadius: "8px",
              padding: "10px",
              color: "#212a1f",
            }}
            labelStyle={{ color: "rgba(33, 42, 31, 0.6)" }}
            formatter={(value) => {
              const numValue = Number(value) || 0;
              return [
                `$${numValue.toFixed(2)}`,
                "Cumulative P&L",
              ];
            }}
            labelFormatter={(label) => label}
          />
          <ReferenceLine y={0} stroke="rgba(33, 42, 31, 0.3)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: lineColor,
              stroke: "#e6e2c8",
              strokeWidth: 2,
            }}
            fill="url(#pnlGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
