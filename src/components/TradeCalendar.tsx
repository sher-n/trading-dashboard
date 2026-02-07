"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Trade {
  // Support both camelCase and snake_case (API returns snake_case from SQLite)
  exitTime?: string;
  exit_time?: string;
  netPnl?: number;
  net_pnl?: number;
  pnl?: number;
  [key: string]: unknown;
}

interface TradeCalendarProps {
  trades: Trade[];
}

function getExitTime(trade: Trade): string | undefined {
  return (trade.exitTime ?? trade.exit_time) as string | undefined;
}

function getPnl(trade: Trade): number {
  return (trade.net_pnl ?? trade.netPnl ?? trade.pnl ?? 0) as number;
}

interface DayData {
  pnl: number;
  tradeCount: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function TradeCalendar({ trades }: TradeCalendarProps) {
  const dailyPnl = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const trade of trades) {
      const exitTime = getExitTime(trade);
      if (!exitTime) continue;
      const date = new Date(exitTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const existing = map.get(key) || { pnl: 0, tradeCount: 0 };
      existing.pnl += getPnl(trade);
      existing.tradeCount += 1;
      map.set(key, existing);
    }
    return map;
  }, [trades]);

  // Find the latest trading month as default
  const defaultDate = useMemo(() => {
    if (trades.length === 0) return new Date();
    const dates = trades
      .filter((t) => getExitTime(t))
      .map((t) => new Date(getExitTime(t)!));
    if (dates.length === 0) return new Date();
    return dates.reduce((a, b) => (a > b ? a : b));
  }, [trades]);

  const [viewYear, setViewYear] = useState(defaultDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(defaultDate.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Compute monthly totals
  const monthTotal = useMemo(() => {
    let pnl = 0;
    let tradeCount = 0;
    let tradingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const data = dailyPnl.get(key);
      if (data) {
        pnl += data.pnl;
        tradeCount += data.tradeCount;
        tradingDays++;
      }
    }
    return { pnl, tradeCount, tradingDays };
  }, [dailyPnl, viewYear, viewMonth, daysInMonth]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 text-[var(--text)]/50 hover:text-[var(--text)] hover:bg-[var(--text)]/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[var(--text)] font-semibold">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 text-[var(--text)]/50 hover:text-[var(--text)] hover:bg-[var(--text)]/10 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Monthly summary */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <span className="text-[var(--text)]/50">
          {monthTotal.tradingDays} trading day{monthTotal.tradingDays !== 1 ? "s" : ""}
        </span>
        <span className="text-[var(--text)]/50">
          {monthTotal.tradeCount} trade{monthTotal.tradeCount !== 1 ? "s" : ""}
        </span>
        <span
          className={`font-semibold ${
            monthTotal.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
          }`}
        >
          {monthTotal.pnl >= 0 ? "+" : ""}${monthTotal.pnl.toFixed(2)}
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-[var(--text)]/40 font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = dailyPnl.get(key);

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative group transition-colors ${
                data
                  ? data.pnl >= 0
                    ? "bg-[var(--green)]/15 border border-[var(--green)]/25"
                    : "bg-[var(--red)]/15 border border-[var(--red)]/25"
                  : "border border-transparent"
              }`}
            >
              <span
                className={`text-[10px] leading-none ${
                  data ? "text-[var(--text)]/70" : "text-[var(--text)]/25"
                }`}
              >
                {day}
              </span>
              {data && (
                <span
                  className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                    data.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}
                >
                  {data.pnl >= 0 ? "+" : ""}
                  {Math.abs(data.pnl) >= 1000
                    ? `$${(data.pnl / 1000).toFixed(1)}k`
                    : `$${data.pnl.toFixed(0)}`}
                </span>
              )}

              {/* Tooltip */}
              {data && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--bg)] border border-[var(--text)]/20 rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                  <p className="text-[var(--text)] text-xs font-semibold">
                    {new Date(viewYear, viewMonth, day).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      data.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                    }`}
                  >
                    {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                  </p>
                  <p className="text-[var(--text)]/50 text-[10px]">
                    {data.tradeCount} trade{data.tradeCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
