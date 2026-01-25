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
      <div className="h-[300px] flex items-center justify-center text-gray-500">
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

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={chartData[chartData.length - 1]?.pnl >= 0 ? "#22c55e" : "#ef4444"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={chartData[chartData.length - 1]?.pnl >= 0 ? "#22c55e" : "#ef4444"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="formattedTime"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={{ stroke: "#4b5563" }}
            axisLine={{ stroke: "#4b5563" }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={{ stroke: "#4b5563" }}
            axisLine={{ stroke: "#4b5563" }}
            domain={[minPnl - padding, maxPnl + padding]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              padding: "10px",
            }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value) => {
              const numValue = Number(value) || 0;
              return [
                `$${numValue.toFixed(2)}`,
                "Cumulative P&L",
              ];
            }}
            labelFormatter={(label) => label}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke={chartData[chartData.length - 1]?.pnl >= 0 ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: chartData[chartData.length - 1]?.pnl >= 0 ? "#22c55e" : "#ef4444",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            fill="url(#pnlGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
