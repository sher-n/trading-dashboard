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
      className={`bg-[var(--bg)] border border-[var(--text)]/15 rounded-xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--text)]/50 text-sm font-medium">{title}</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              trend ? trendColors[trend] : "text-[var(--text)]"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-[var(--text)]/40 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-[var(--text)]/10 rounded-lg">{icon}</div>
        )}
      </div>
    </div>
  );
}
