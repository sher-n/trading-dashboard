"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Trade {
  id: number;
  position_id: string;
  symbol: string;
  direction: string;
  entry_time: string;
  exit_time: string | null;
  entry_price: number;
  exit_price: number | null;
  qty: number;
  pnl: number | null;
  commission: number;
  net_pnl: number | null;
  duration_seconds: number | null;
  exit_type: string | null;
  is_closed: number;
}

interface TradesTableProps {
  trades: Trade[];
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TradesTable({ trades }: TradesTableProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No trades to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Direction</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Entry</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Exit</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Qty</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Duration</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Exit Type</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-medium text-white">{trade.symbol}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    trade.direction === "Long"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {trade.direction === "Long" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {trade.direction}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-300">
                <div>{formatDate(trade.entry_time)}</div>
                <div className="text-xs text-gray-500">
                  @ ${trade.entry_price?.toFixed(2)}
                </div>
              </td>
              <td className="py-3 px-4 text-gray-300">
                <div>{formatDate(trade.exit_time)}</div>
                {trade.exit_price && (
                  <div className="text-xs text-gray-500">
                    @ ${trade.exit_price.toFixed(2)}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-right text-gray-300">
                {trade.qty}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`font-medium ${
                    trade.pnl === null
                      ? "text-gray-500"
                      : trade.pnl >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {trade.pnl !== null
                    ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`
                    : "-"}
                </span>
              </td>
              <td className="py-3 px-4 text-right text-gray-300">
                {formatDuration(trade.duration_seconds)}
              </td>
              <td className="py-3 px-4">
                {trade.exit_type ? (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      trade.exit_type === "Take Profit"
                        ? "bg-green-500/20 text-green-400"
                        : trade.exit_type === "Stop Loss"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {trade.exit_type}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-500">Open</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
