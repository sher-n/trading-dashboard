"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SymbolStatsProps {
  data: Record<string, { wins: number; losses: number; pnl: number }>;
}

export default function SymbolStats({ data }: SymbolStatsProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500">
        No symbol data available
      </div>
    );
  }

  const chartData = Object.entries(data)
    .map(([symbol, stats]) => ({
      symbol,
      pnl: stats.pnl,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.wins + stats.losses > 0
        ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
        : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={{ stroke: "#4b5563" }}
            axisLine={{ stroke: "#4b5563" }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            type="category"
            dataKey="symbol"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={{ stroke: "#4b5563" }}
            axisLine={{ stroke: "#4b5563" }}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              padding: "10px",
            }}
            labelStyle={{ color: "#fff", fontWeight: "bold" }}
            formatter={(value, _name, props) => {
              const numValue = Number(value) || 0;
              const item = (props as any).payload;
              return [
                `P&L: $${numValue.toFixed(2)} | W:${item?.wins || 0} L:${item?.losses || 0}`,
                "",
              ];
            }}
          />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
