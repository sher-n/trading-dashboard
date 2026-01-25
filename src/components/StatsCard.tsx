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
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  return (
    <div
      className={`bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              trend ? trendColors[trend] : "text-white"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-700/50 rounded-lg">{icon}</div>
        )}
      </div>
    </div>
  );
}
