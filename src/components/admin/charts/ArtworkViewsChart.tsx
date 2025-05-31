"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ChartData {
  period: string;
  count: number;
}

interface ArtworkViewsChartProps {
  data: ChartData[];
}

export default function ArtworkViewsChart({ data }: ArtworkViewsChartProps) {
  const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={(value) => {
              try {
                return format(new Date(value), "MMM dd");
              } catch (e) {
                return value;
              }
            }}
          />
          <YAxis />
          <Tooltip
             labelFormatter={(label) => {
                try {
                  return format(new Date(label), "yyyy-MM-dd");
                } catch (e) {
                  return label;
                }
              }}
          />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
