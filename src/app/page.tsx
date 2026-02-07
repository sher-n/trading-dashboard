"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Trash2,
  Wallet,
  Goal,
  ShieldAlert,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import StatsCard from "@/components/StatsCard";
import PnLChart from "@/components/PnLChart";
import TradesTable from "@/components/TradesTable";
import SymbolStats from "@/components/SymbolStats";
import TradeCalendar from "@/components/TradeCalendar";

interface TradingStats {
  totalTrades: number;
  avgTradesPerDay: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalNetPnl: number;
  maxProfit: number;
  maxLoss: number;
  avgProfit: number;
  avgLoss: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  currentWinStreak: number;
  currentLoseStreak: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  profitFactor: number;
  maxEquity: number;
  minEquity: number;
  pnlCurve: Array<{ time: string; pnl: number; symbol: string }>;
  symbolStats: Record<string, { wins: number; losses: number; pnl: number }>;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(balanceInput);
    if (!isNaN(value) && value > 0) {
      setBalance(value);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tradesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/trades"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setTrades(tradesData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all trading data?")) return;

    setClearing(true);
    try {
      const res = await fetch("/api/clear", { method: "POST" });
      if (res.ok) {
        setStats(null);
        setTrades([]);
      }
    } catch (error) {
      console.error("Failed to clear data:", error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--text)]/15 bg-[var(--bg)] sticky top-0 z-50">
        <div className="mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-[var(--green)]/15 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[var(--green)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text)] leading-tight">Trading Dashboard</h1>
                <p className="text-[var(--text)]/50 text-xs">Analyze your trading performance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileUpload onUploadComplete={fetchData} />
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-1.5 text-[var(--text)]/50 hover:text-[var(--text)] hover:bg-[var(--text)]/10 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="p-1.5 text-[var(--text)]/50 hover:text-[var(--red)] hover:bg-[var(--red)]/10 rounded-lg transition-colors"
                title="Clear all data"
              >
                <Trash2 className={`w-4 h-4 ${clearing ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-3 space-y-3">
        {/* Account Balance Section */}
        <section className="bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-3">
          <form onSubmit={handleBalanceSubmit} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--green)]" />
              <label className="text-[var(--text)] font-medium text-sm">Account Balance</label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text)]/50 text-sm">$</span>
              <input
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="Enter balance"
                className="bg-[var(--text)]/5 border border-[var(--text)]/20 rounded-lg px-2 py-1 text-[var(--text)] text-sm w-36 focus:outline-none focus:border-[var(--green)]"
                step="0.01"
                min="0"
              />
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-[var(--green)] hover:bg-[var(--green)]/85 text-[var(--bg)] rounded-lg transition-colors"
              >
                Set
              </button>
            </div>
            {balance !== null && (
              <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[var(--green)]" />
                  <span className="text-[var(--text)]/50 text-xs">Balance</span>
                  <span className="text-[var(--text)] font-bold text-sm">${balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Goal className="w-4 h-4 text-[var(--green)]" />
                  <span className="text-[var(--text)]/50 text-xs">Goal 3%</span>
                  <span className="text-[var(--green)] font-bold text-sm">+${(balance * 0.03).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[var(--red)]" />
                  <span className="text-[var(--text)]/50 text-xs">Risk 0.5-1%</span>
                  <span className="text-[var(--red)] font-bold text-sm">
                    ${(balance * 0.005).toFixed(2)} - ${(balance * 0.01).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* Stats Overview */}
        {stats && stats.totalTrades > 0 && (
          <>
            {/* All Stats in 2 rows */}
            <section className="grid grid-cols-5 md:grid-cols-10 gap-2">
              <StatsCard
                title="Total P&L"
                value={`${stats.totalNetPnl >= 0 ? "+" : ""}$${stats.totalNetPnl.toFixed(2)}`}
                subtitle={`Gross: $${stats.totalPnl.toFixed(2)}`}
                trend={stats.totalNetPnl >= 0 ? "up" : "down"}
                icon={
                  stats.totalNetPnl >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-[var(--green)]" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-[var(--red)]" />
                  )
                }
              />
              <StatsCard
                title="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
                trend={stats.winRate >= 50 ? "up" : "down"}
                icon={<Target className="w-4 h-4 text-[var(--green)]" />}
              />
              <StatsCard
                title="Profit Factor"
                value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                subtitle="Profit / Loss"
                trend={stats.profitFactor >= 1 ? "up" : "down"}
              />
              <StatsCard
                title="Total Trades"
                value={stats.totalTrades}
                subtitle={`${stats.avgTradesPerDay.toFixed(1)}/day`}
              />
              <StatsCard
                title="Max Profit"
                value={`+$${stats.maxProfit.toFixed(2)}`}
                subtitle={`Avg: +$${stats.avgProfit.toFixed(2)}`}
                trend="up"
              />
              <StatsCard
                title="Max Loss"
                value={`$${stats.maxLoss.toFixed(2)}`}
                subtitle={`Avg: $${stats.avgLoss.toFixed(2)}`}
                trend="down"
              />
              <StatsCard
                title="Win Streak"
                value={stats.maxWinStreak}
                subtitle={`Current: ${stats.currentWinStreak}`}
                trend="up"
              />
              <StatsCard
                title="Lose Streak"
                value={stats.maxLoseStreak}
                subtitle={`Current: ${stats.currentLoseStreak}`}
                trend="down"
              />
              <StatsCard
                title="Max Upside"
                value={`+$${stats.maxEquity.toFixed(2)}`}
                subtitle="Peak equity"
                trend="up"
              />
              <StatsCard
                title="Max Downside"
                value={`$${stats.minEquity.toFixed(2)}`}
                subtitle="Lowest equity"
                trend="down"
              />
            </section>

            {/* Duration Stats Row */}
            <section className="grid grid-cols-3 gap-2">
              <StatsCard
                title="Min Duration"
                value={formatDuration(stats.minDuration)}
                subtitle="Fastest trade"
              />
              <StatsCard
                title="Avg Duration"
                value={formatDuration(stats.avgDuration)}
                subtitle="Average hold time"
              />
              <StatsCard
                title="Max Duration"
                value={formatDuration(stats.maxDuration)}
                subtitle="Longest trade"
              />
            </section>

            {/* Charts + Calendar Row: Equity Curve | Symbol Stats | Calendar */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* PnL Curve */}
              <div className="lg:col-span-5 bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-2">
                  Equity Curve (Cumulative P&L)
                </h2>
                <PnLChart data={stats.pnlCurve} />
              </div>

              {/* Symbol Performance */}
              <div className="lg:col-span-2 bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-2">
                  P&L by Symbol
                </h2>
                <SymbolStats data={stats.symbolStats} />
              </div>

              {/* Trade Calendar */}
              <div className="lg:col-span-5 bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-4">
                <TradeCalendar trades={trades} />
              </div>
            </section>

            {/* Trades Table */}
            <section className="bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                Trade History ({trades.length} trades)
              </h2>
              <TradesTable trades={trades} />
            </section>
          </>
        )}

        {/* Empty State */}
        {!loading && (!stats || stats.totalTrades === 0) && (
          <div className="text-center py-16">
            <div className="p-4 bg-[var(--text)]/10 rounded-full w-fit mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-[var(--text)]/30" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
              No trading data yet
            </h2>
            <p className="text-[var(--text)]/50">
              Upload your TradingView CSV file to see your trading statistics
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (!stats || stats.totalTrades === 0) && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-[var(--green)] animate-spin mx-auto mb-4" />
            <p className="text-[var(--text)]/50">Loading trading data...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--text)]/15 mt-4 py-2">
        <div className="mx-auto px-6 text-center text-[var(--text)]/50 text-xs">
          Trading Dashboard • Built with Next.js, Drizzle ORM & SQLite
        </div>
      </footer>
    </div>
  );
}
