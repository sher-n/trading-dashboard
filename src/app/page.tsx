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
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import StatsCard from "@/components/StatsCard";
import PnLChart from "@/components/PnLChart";
import TradesTable from "@/components/TradesTable";
import SymbolStats from "@/components/SymbolStats";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Trading Dashboard</h1>
                <p className="text-gray-500 text-sm">Analyze your trading performance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileUpload onUploadComplete={fetchData} />
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Clear all data"
              >
                <Trash2 className={`w-5 h-5 ${clearing ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        {stats && stats.totalTrades > 0 && (
          <>
            {/* Main Stats Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                title="Total P&L"
                value={`${stats.totalNetPnl >= 0 ? "+" : ""}$${stats.totalNetPnl.toFixed(2)}`}
                subtitle={`Gross: $${stats.totalPnl.toFixed(2)}`}
                trend={stats.totalNetPnl >= 0 ? "up" : "down"}
                icon={
                  stats.totalNetPnl >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )
                }
              />
              <StatsCard
                title="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
                trend={stats.winRate >= 50 ? "up" : "down"}
                icon={<Target className="w-5 h-5 text-blue-400" />}
              />
              <StatsCard
                title="Profit Factor"
                value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                subtitle="Gross Profit / Gross Loss"
                trend={stats.profitFactor >= 1 ? "up" : "down"}
                icon={<Award className="w-5 h-5 text-yellow-400" />}
              />
              <StatsCard
                title="Total Trades"
                value={stats.totalTrades}
                subtitle={`${stats.avgTradesPerDay.toFixed(1)}/day avg`}
                icon={<Clock className="w-5 h-5 text-purple-400" />}
              />
            </section>

            {/* Secondary Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              />
              <StatsCard
                title="Lose Streak"
                value={stats.maxLoseStreak}
                subtitle={`Current: ${stats.currentLoseStreak}`}
                trend="down"
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
              />
            </section>

            {/* Equity Curve Stats */}
            <section className="grid grid-cols-2 gap-4">
              <StatsCard
                title="Max Upside"
                value={`+$${stats.maxEquity.toFixed(2)}`}
                subtitle="Peak equity"
                trend="up"
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              />
              <StatsCard
                title="Max Downside"
                value={`$${stats.minEquity.toFixed(2)}`}
                subtitle="Lowest equity"
                trend="down"
                icon={<TrendingDown className="w-5 h-5 text-red-400" />}
              />
            </section>

            {/* Duration Stats */}
            <section className="grid grid-cols-3 gap-4">
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

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PnL Curve */}
              <div className="lg:col-span-2 bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Equity Curve (Cumulative P&L)
                </h2>
                <PnLChart data={stats.pnlCurve} />
              </div>

              {/* Symbol Performance */}
              <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">
                  P&L by Symbol
                </h2>
                <SymbolStats data={stats.symbolStats} />
              </div>
            </section>

            {/* Trades Table */}
            <section className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Trade History ({trades.length} trades)
              </h2>
              <TradesTable trades={trades} />
            </section>
          </>
        )}

        {/* Empty State */}
        {!loading && (!stats || stats.totalTrades === 0) && (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-800/50 rounded-full w-fit mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No trading data yet
            </h2>
            <p className="text-gray-500">
              Upload your TradingView CSV file to see your trading statistics
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (!stats || stats.totalTrades === 0) && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading trading data...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          Trading Dashboard • Built with Next.js, Drizzle ORM & SQLite
        </div>
      </footer>
    </div>
  );
}
