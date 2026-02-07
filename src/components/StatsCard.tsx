"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = "",
}: StatsCardProps) {
  const trendColors = {
    up: "text-[var(--green)]",
    down: "text-[var(--red)]",
    neutral: "text-[var(--text)]/60",
  };

  return (
    <div
      className={`bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-3 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[var(--text)]/50 text-xs font-medium truncate">{title}</p>
          <p
            className={`text-lg font-bold mt-0.5 truncate ${
              trend ? trendColors[trend] : "text-[var(--text)]"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-[var(--text)]/40 text-[10px] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-1.5 bg-[var(--text)]/10 rounded-lg shrink-0">{icon}</div>
        )}
      </div>
    </div>
  );
}
